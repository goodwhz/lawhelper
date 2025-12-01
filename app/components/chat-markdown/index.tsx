'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'

interface SimpleMessage {
  id: string
  content: string
  isAnswer: boolean
}

// 简单的Markdown解析器
function parseMarkdown(text: string): JSX.Element[] {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentList: JSX.Element[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  lines.forEach((line, index) => {
    // 处理标题
    if (line.startsWith('### ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h3', { 
          key: `h3-${index}`, 
          className: 'text-lg font-semibold text-gray-900 mb-2 mt-4' 
        }, parseInlineMarkdown(line.substring(4)))
      );
      return;
    }
    
    if (line.startsWith('## ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h2', { 
          key: `h2-${index}`, 
          className: 'text-xl font-bold text-gray-900 mb-3 mt-6' 
        }, parseInlineMarkdown(line.substring(3)))
      );
      return;
    }
    
    if (line.startsWith('# ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('h1', { 
          key: `h1-${index}`, 
          className: 'text-2xl font-bold text-gray-900 mb-4 mt-8' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理引用
    if (line.startsWith('> ')) {
      if (inList) {
        elements.push(
          React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        React.createElement('blockquote', { 
          key: `quote-${index}`, 
          className: 'border-l-4 border-gray-300 pl-4 py-2 my-2 bg-gray-50 text-gray-600 italic' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理无序列表
    if (line.match(/^[\*\-\+] /)) {
      if (!inList) {
        listType = 'ul';
        inList = true;
      }
      currentList.push(
        React.createElement('li', { 
          key: `li-${index}`, 
          className: 'mb-1 text-gray-800' 
        }, parseInlineMarkdown(line.substring(2)))
      );
      return;
    }

    // 处理有序列表
    if (line.match(/^\d+\. /)) {
      if (!inList) {
        listType = 'ol';
        inList = true;
      }
      currentList.push(
        React.createElement('li', { 
          key: `li-${index}`, 
          className: 'mb-1 text-gray-800' 
        }, parseInlineMarkdown(line.substring(line.indexOf('. ') + 2)))
      );
      return;
    }

    // 结束列表
    if (inList && line.trim() === '') {
      elements.push(
        React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
      );
      currentList = [];
      inList = false;
      return;
    }

    // 普通段落
    if (inList) {
      elements.push(
        React.createElement(listType, { key: `list-${index}`, className: 'ml-4 mb-2' }, currentList)
      );
      currentList = [];
      inList = false;
    }

    if (line.trim() !== '') {
      elements.push(
        React.createElement('p', { 
          key: `p-${index}`, 
          className: 'text-gray-800 mb-2' 
        }, parseInlineMarkdown(line))
      );
    } else {
      elements.push(React.createElement('br', { key: `br-${index}` }));
    }
  });

  // 处理最后的列表
  if (inList && currentList.length > 0) {
    elements.push(
      React.createElement(listType, { key: 'list-final', className: 'ml-4 mb-2' }, currentList)
    );
  }

  return elements;
}

// 处理内联Markdown（加粗、斜体、代码等）
function parseInlineMarkdown(text: string): React.ReactNode {
  // 处理代码块
  let processedText = text;
  const codeBlocks: React.ReactNode[] = [];
  
  // 处理内联代码 `code`
  processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // 处理加粗 **text**
  processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-red-600 font-semibold">$1</strong>');
  
  // 处理斜体 *text*
  processedText = processedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-600">$1</em>');
  
  // 处理链接 [text](url)
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  
  return React.createElement('span', { 
    dangerouslySetInnerHTML: { __html: processedText } 
  });
}

const MarkdownChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [showQuickResponse, setShowQuickResponse] = useState(true)
  const [error, setError] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsResponding(false)
  }, [])

  const handleSend = useCallback(async (content: string) => {
    if (isResponding || !content.trim()) return

    setIsResponding(true)
    setShowQuickResponse(false)
    setError('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 创建用户消息
      const userMessage: SimpleMessage = {
        id: `user_${Date.now()}`,
        content: content.trim(),
        isAnswer: false,
      }
      
      setMessages(prev => [...prev, userMessage])

      // 创建空的AI消息
      const aiMessage: SimpleMessage = {
        id: `ai_${Date.now()}`,
        content: '',
        isAnswer: true,
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsResponding(true)

      // 发送消息到API
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: content.trim(),
          response_mode: 'streaming',
          conversation_id: undefined,
          user: 'user_markdown',
          auto_generate_name: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentContent = ''
      let isWorkflowMode = false
      let lastProcessedAnswer = ''

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('流式响应结束')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              // 处理不同类型的事件
              if (parsed.event === 'message' || parsed.event === 'agent_message') {
                // 在workflow模式下跳过普通消息事件
                if (isWorkflowMode) {
                  console.log('跳过workflow模式下的message事件')
                  continue
                }
                
                if (parsed.answer) {
                  currentContent += parsed.answer
                  setMessages(prev => {
                    const newList = [...prev]
                    const lastMessage = newList[newList.length - 1]
                    if (lastMessage && lastMessage.isAnswer) {
                      lastMessage.content = currentContent
                    }
                    return newList
                  })
                }
              }
              else if (parsed.event === 'workflow_started') {
                isWorkflowMode = true
                console.log('进入workflow模式')
              }
              else if (parsed.event === 'workflow_finished' && parsed.data?.outputs?.answer) {
                let answer = parsed.data.outputs.answer || ''
                if (answer) {
                  // 检查是否是新的答案内容
                  if (!lastProcessedAnswer) {
                    currentContent = answer
                    setMessages(prev => {
                      const newList = [...prev]
                      const lastMessage = newList[newList.length - 1]
                      if (lastMessage && lastMessage.isAnswer) {
                        lastMessage.content = currentContent
                      }
                      return newList
                    })
                  } else if (answer.length > lastProcessedAnswer.length) {
                    // 只添加增量内容
                    const incrementalContent = answer.substring(lastProcessedAnswer.length)
                    currentContent += incrementalContent
                    setMessages(prev => {
                      const newList = [...prev]
                      const lastMessage = newList[newList.length - 1]
                      if (lastMessage && lastMessage.isAnswer) {
                        lastMessage.content = currentContent
                      }
                      return newList
                    })
                  }
                  lastProcessedAnswer = answer
                }
              }
              else if (parsed.event === 'message_end') {
                console.log('消息结束')
              }
            } catch (e) {
              console.warn('解析数据失败:', e)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('发送消息失败:', error)
      if (error.name === 'AbortError') {
        console.log('请求被取消')
      } else {
        setError(error.message || '发送消息失败，请重试')
      }
    } finally {
      setIsResponding(false)
    }
  }, [isResponding])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showQuickResponse && messages.length === 0 && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  专业劳动法AI助手 (Markdown版)
                </h1>
                <p className="text-gray-600">
                  我是您的专业劳动法助手，支持**格式化输出**，包括加粗、列表、链接等
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用Markdown格式解释劳动合同的基本要素')}>
                  <h3 className="font-medium text-gray-900 mb-2">劳动合同咨询</h3>
                  <p className="text-sm text-gray-600">了解劳动合同的**基本要素**和注意事项</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用格式化方式说明加班工资的计算方法')}>
                  <h3 className="font-medium text-gray-900 mb-2">工资计算</h3>
                  <p className="text-sm text-gray-600">了解**加班工资**的计算方式</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请详细说明解除劳动合同的各种情形')}>
                  <h3 className="font-medium text-gray-900 mb-2">解除劳动关系</h3>
                  <p className="text-sm text-gray-600">了解解除劳动合同的**条件**和程序</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('请用列表说明社保缴纳的具体标准')}>
                  <h3 className="font-medium text-gray-900 mb-2">社会保险</h3>
                  <p className="text-sm text-gray-600">了解社保缴纳的**比例和标准**</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.isAnswer ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-lg ${
                message.isAnswer 
                  ? 'bg-white border border-gray-200 text-gray-900' 
                  : 'bg-blue-600 text-white'
              }`}>
                {message.isAnswer && (
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">🤖</span>
                    </div>
                    <span className="text-sm text-gray-600">AI助手</span>
                  </div>
                )}
                
                {/* AI消息使用简单Markdown渲染，用户消息使用纯文本 */}
                {message.isAnswer ? (
                  <div className="space-y-2">
                    {message.content ? parseMarkdown(message.content) : (
                      <div className="text-gray-500">
                        {isResponding && index === messages.length - 1 ? '正在思考中...' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}
                
                {!message.isAnswer && (
                  <div className="flex items-center mt-2 justify-end">
                    <span className="text-xs text-blue-100">用户</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-2xl px-4 py-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs">🤖</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI正在思考中...</span>
                    <button
                      onClick={handleStop}
                      className="ml-4 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                    >
                      停止
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const message = formData.get('message') as string
              if (message?.trim()) {
                handleSend(message.trim())
                e.currentTarget.reset()
              }
            }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-end space-x-2">
              <textarea
                name="message"
                placeholder="请输入您的问题... (支持Markdown格式回复)"
                disabled={isResponding}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const form = e.currentTarget.form
                    if (form) {
                      const formData = new FormData(form)
                      const message = formData.get('message') as string
                      if (message?.trim()) {
                        handleSend(message.trim())
                        form.reset()
                      }
                    }
                  }
                }}
              />
              <button
                type="submit"
                disabled={isResponding}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isResponding ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
          
          {/* Markdown提示 */}
          <div className="max-w-4xl mx-auto mt-2 text-xs text-gray-500 text-center">
            AI回复支持格式化显示：**加粗** *斜体* `代码` 列表 引用等
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkdownChatComponent