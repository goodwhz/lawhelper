import { API_PREFIX } from '@/config'
import Toast from '@/app/components/base/toast'
import type { AnnotationReply, MessageEnd, MessageReplace, ThoughtItem } from '@/app/components/chat/type'
import type { VisionFile } from '@/types/app'

const TIME_OUT = 100000

const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // for download
}

const baseOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include', // always send cookies、HTTP Basic authentication.
  headers: new Headers({
    'Content-Type': ContentType.json,
  }),
  redirect: 'follow',
}

export interface WorkflowStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    sequence_number: number
    created_at: number
  }
}

export interface WorkflowFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: any
    error: string
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number
    finished_at: number
  }
}

export interface NodeStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    created_at: number
    extras?: any
  }
}

export interface NodeFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    process_data: any
    outputs: any
    status: string
    error: string
    elapsed_time: number
    execution_metadata: {
      total_tokens: number
      total_price: number
      currency: string
    }
    created_at: number
  }
}

export interface IOnDataMoreInfo {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void
export type IOnThought = (though: ThoughtItem) => void
export type IOnFile = (file: VisionFile) => void
export type IOnMessageEnd = (messageEnd: MessageEnd) => void
export type IOnMessageReplace = (messageReplace: MessageReplace) => void
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void
export type IOnCompleted = (hasError?: boolean) => void
export type IOnError = (msg: string, code?: string) => void
export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void

interface IOtherOptions {
  isPublicAPI?: boolean
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  onData?: IOnData // for stream
  onThought?: IOnThought
  onFile?: IOnFile
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  onError?: IOnError
  onCompleted?: IOnCompleted // for stream
  getAbortController?: (abortController: AbortController) => void
  onWorkflowStarted?: IOnWorkflowStarted
  onWorkflowFinished?: IOnWorkflowFinished
  onNodeStarted?: IOnNodeStarted
  onNodeFinished?: IOnNodeFinished
}

function unicodeToChar(text: string) {
  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
}

const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
) => {
  if (!response.ok) { throw new Error('Network response was not ok') }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let bufferObj: Record<string, any>
  let isFirstMessage = true
  let lastProcessedAnswer = '' // 用于去重
  const processedMessageIds = new Set<string>() // 用于避免重复处理同一条消息
  const processedWorkflowIds = new Set<string>() // 用于避免重复处理同一个workflow
  let isWorkflowMode = false // 标记是否为workflow模式
  function read() {
    let hasError = false;
    reader?.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted();
        return;
      }
      
      // 解码数据并限制缓冲区大小
      const chunk = decoder.decode(result.value, { stream: true });
      buffer += chunk;
      
      // 如果缓冲区过大，清理旧数据
      if (buffer.length > 1024 * 1024) { // 1MB限制
        const lastNewlineIndex = buffer.lastIndexOf('\n');
        if (lastNewlineIndex > 0) {
          buffer = buffer.substring(lastNewlineIndex + 1);
        }
      }
      
      const lines = buffer.split('\n');
      // 保留最后一行（可能是不完整的）
      buffer = lines.pop() || '';
      
      try {
        for (const message of lines) {
          if (message.startsWith('data: ')) { // check if it starts with data:
            const dataStr = message.substring(6).trim();
            if (!dataStr || dataStr === '[DONE]') {
              continue;
            }
            
            // 限制数据大小，防止内存分配失败
            if (dataStr.length > 10 * 1024 * 1024) { // 10MB限制
              console.warn('跳过过大的数据块:', dataStr.length, 'bytes');
              continue;
            }
            
            try {
              bufferObj = JSON.parse(dataStr) as Record<string, any>; // remove data: and parse as json
            }
            catch (e) {
              console.error('JSON解析失败:', dataStr.slice(0, 100), '...');
              // mute handle message cut off
              if (bufferObj?.conversation_id) {
                onData('', isFirstMessage, {
                  conversationId: bufferObj?.conversation_id,
                  messageId: bufferObj?.message_id,
                });
              }
              continue;
            }
            
            if (bufferObj.status === 400 || !bufferObj.event) {
              onData('', false, {
                conversationId: undefined,
                messageId: '',
                errorMessage: bufferObj?.message,
                errorCode: bufferObj?.code,
              });
              hasError = true;
              onCompleted?.(true);
              return;
            }
            
            if (bufferObj.event === 'message' || bufferObj.event === 'agent_message') {
              // 严格跳过message事件，因为在workflow模式下，所有内容都会从workflow_finished中获取
              // 这样彻底避免重复输出问题
              console.log('Service层：严格跳过message事件，避免重复');
              continue;
            }
            else if (bufferObj.event === 'workflow_started') {
              // 标记进入workflow模式
              isWorkflowMode = true;
              console.log('Service层：进入workflow模式');
              onWorkflowStarted?.(bufferObj as WorkflowStartedResponse);
              continue;
            }
            // 处理workflow完成的最终答案
            else if (bufferObj.event === 'workflow_finished' && bufferObj.data?.outputs?.answer) {
              let answer = bufferObj.data.outputs.answer || '';
              if (answer) {
                answer = unicodeToChar(answer);
                console.log('Service层：从workflow_finished获取完整答案，长度:', answer.length);
                
                // 严格的去重检查
                if (!lastProcessedAnswer) {
                  console.log('Service层：首次输出workflow答案');
                  onData(answer, isFirstMessage, {
                    conversationId: bufferObj.conversation_id,
                    taskId: bufferObj.task_id,
                    messageId: bufferObj.message_id,
                  });
                  lastProcessedAnswer = answer;
                  isFirstMessage = false;
                } else if (answer !== lastProcessedAnswer) {
                  console.log('Service层：检测到新答案，更新输出');
                  // 只输出增量部分
                  const incrementalContent = answer.replace(lastProcessedAnswer, '');
                  if (incrementalContent) {
                    onData(incrementalContent, isFirstMessage, {
                      conversationId: bufferObj.conversation_id,
                      taskId: bufferObj.task_id,
                      messageId: bufferObj.message_id,
                    });
                    lastProcessedAnswer = answer;
                    isFirstMessage = false;
                  } else {
                    console.log('Service层：无增量内容，跳过');
                  }
                } else {
                  console.log('Service层：workflow_finished答案重复，严格跳过');
                }
              }
              onWorkflowFinished?.(bufferObj as WorkflowFinishedResponse);
              continue;
            }
            else if (bufferObj.event === 'agent_thought') {
              onThought?.(bufferObj as ThoughtItem);
            }
            else if (bufferObj.event === 'message_file') {
              onFile?.(bufferObj as VisionFile);
            }
            else if (bufferObj.event === 'message_end') {
              onMessageEnd?.(bufferObj as MessageEnd);
            }
            else if (bufferObj.event === 'message_replace') {
              onMessageReplace?.(bufferObj as MessageReplace);
            }
            else if (bufferObj.event === 'node_started') {
              onNodeStarted?.(bufferObj as NodeStartedResponse);
            }
            else if (bufferObj.event === 'node_finished') {
              onNodeFinished?.(bufferObj as NodeFinishedResponse);
            }
          }
        }
      }
      catch (e) {
        console.error('流处理错误:', e);
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        });
        hasError = true;
        onCompleted?.(true);
        return;
      }
      
      // 清理已处理的数据，防止内存泄漏
      if (!hasError) { 
        // 限制Set的大小，防止内存无限增长
        if (processedMessageIds.size > 1000) {
          processedMessageIds.clear();
        }
        if (processedWorkflowIds.size > 100) {
          processedWorkflowIds.clear();
        }
        read(); 
      }
    });
  }
  read();
}

const baseFetch = (url: string, fetchOptions: any, { needAllResponseContent }: IOtherOptions) => {
  const options = Object.assign({}, baseOptions, fetchOptions)

  const urlPrefix = API_PREFIX

  let urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options
  // handle query
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach(key =>
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`),
    )
    if (urlWithPrefix.search(/\?/) === -1) { urlWithPrefix += `?${paramsArray.join('&')}` }

    else { urlWithPrefix += `&${paramsArray.join('&')}` }

    delete options.params
  }

  if (body) { options.body = JSON.stringify(body) }

  // Handle timeout
  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('request timeout'))
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis.fetch(urlWithPrefix, options)
        .then((res: any) => {
          const resClone = res.clone()
          // Error handler
          if (!/^(2|3)\d{2}$/.test(res.status)) {
            try {
              // 检查响应体是否有内容
              const contentLength = res.headers.get('Content-Length')
              if (contentLength && parseInt(contentLength) > 0) {
                res.json().then((data: any) => {
                  switch (res.status) {
                    case 401: {
                      Toast.notify({ type: 'error', message: 'Invalid token' })
                      return
                    }
                    default:
                      Toast.notify({ type: 'error', message: data.message || 'Unknown error' })
                  }
                }).catch(() => {
                  // 如果解析JSON失败，显示通用错误信息
                  Toast.notify({ type: 'error', message: `HTTP Error ${res.status}: ${res.statusText}` })
                })
              } else {
                // 没有响应体时显示状态码错误
                Toast.notify({ type: 'error', message: `HTTP Error ${res.status}: ${res.statusText}` })
              }
            }
            catch (e) {
              Toast.notify({ type: 'error', message: `${e}` })
            }

            return Promise.reject(resClone)
          }

          // handle delete api. Delete api not return content.
          if (res.status === 204) {
            resolve({ result: 'success' })
            return
          }

          // return data
          const data = options.headers.get('Content-type') === ContentType.download ? res.blob() : res.json()

          resolve(needAllResponseContent ? resClone : data)
        })
        .catch((err) => {
          Toast.notify({ type: 'error', message: err })
          reject(err)
        })
    }),
  ])
}

export const upload = (fetchOptions: any): Promise<any> => {
  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}/file-upload`
  const defaultOptions = {
    method: 'POST',
    url: `${urlWithPrefix}`,
    data: {},
  }
  const options = {
    ...defaultOptions,
    ...fetchOptions,
  }
  return new Promise((resolve, reject) => {
    const xhr = options.xhr
    xhr.open(options.method, options.url)
    for (const key in options.headers) { xhr.setRequestHeader(key, options.headers[key]) }

    xhr.withCredentials = true
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) { resolve({ id: xhr.response }) }
        else { reject(xhr) }
      }
    }
    xhr.upload.onprogress = options.onprogress
    xhr.send(options.data)
  })
}

export const ssePost = (
  url: string,
  fetchOptions: any,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    onError,
  }: IOtherOptions,
) => {
  const options = Object.assign({}, baseOptions, {
    method: 'POST',
  }, fetchOptions)

  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { body } = options
  if (body) { options.body = JSON.stringify(body) }

  globalThis.fetch(urlWithPrefix, options)
    .then((res: any) => {
      if (!/^(2|3)\d{2}$/.test(res.status)) {
        // eslint-disable-next-line no-new
        new Promise(() => {
          res.json().then((data: any) => {
            Toast.notify({ type: 'error', message: data.message || 'Server Error' })
          })
        })
        onError?.('Server Error')
        return
      }
      return handleStream(res, (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
        if (moreInfo.errorMessage) {
          Toast.notify({ type: 'error', message: moreInfo.errorMessage })
          return
        }
        onData?.(str, isFirstMessage, moreInfo)
      }, () => {
        onCompleted?.()
      }, onThought, onMessageEnd, onMessageReplace, onFile, onWorkflowStarted, onWorkflowFinished, onNodeStarted, onNodeFinished)
    })
    .catch((e) => {
      Toast.notify({ type: 'error', message: e })
      onError?.(e)
    })
}

export const request = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return baseFetch(url, options, otherOptions || {})
}

export const get = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'GET' }), otherOptions)
}

export const post = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'POST' }), otherOptions)
}

export const put = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'PUT' }), otherOptions)
}

export const del = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'DELETE' }), otherOptions)
}
