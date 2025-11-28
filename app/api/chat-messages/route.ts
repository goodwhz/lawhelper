import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== Next.js API 路由 ===')
    console.log('收到请求:', body)

    // 创建一个可读流来转发 Dify 的流式响应
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('=== 调用Dify API ===')
          console.log('DIFY_API_URL:', DIFY_API_URL)
          console.log('DIFY_APP_KEY存在:', !!DIFY_APP_KEY)
          console.log('DIFY_APP_KEY前缀:', DIFY_APP_KEY?.substring(0, 10) + '...')

          // 直接调用 Dify API
          const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DIFY_APP_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...body,
              response_mode: 'streaming',
            }),
          })

          console.log('Dify API 响应状态:', response.status)
          console.log('Dify API 响应头:', Object.fromEntries(response.headers.entries()))

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Dify API 错误:', errorText)
            throw new Error(`Dify API error: ${response.status} - ${errorText}`)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          
          // 去重机制
          let isWorkflowMode = false
          let lastProcessedAnswer = ''
          const processedMessageIds = new Set<string>()

          if (!reader) {
            throw new Error('无法获取响应流')
          }

          console.log('开始读取流式响应...')

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
                const data = line.slice(6)
                if (data === '[DONE]') {
                  console.log('收到 [DONE] 信号')
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  
                  // API层面的去重处理
                  if (parsed.event === 'message' || parsed.event === 'agent_message') {
                    // 在workflow模式下完全跳过message事件
                    if (isWorkflowMode) {
                      console.log('API层：workflow模式下跳过message事件')
                      continue
                    }
                    
                    // 避免重复处理同一条消息
                    const messageId = parsed.id
                    if (messageId && processedMessageIds.has(messageId)) {
                      console.log('API层：跳过重复消息ID:', messageId)
                      continue
                    }
                    if (messageId) {
                      processedMessageIds.add(messageId)
                    }
                  }
                  else if (parsed.event === 'workflow_started') {
                    isWorkflowMode = true
                    console.log('API层：进入workflow模式')
                  }
                  else if (parsed.event === 'workflow_finished' && parsed.data?.outputs?.answer) {
                    let answer = parsed.data.outputs.answer || ''
                    if (answer) {
                      // 检查是否已经处理过这个答案
                      if (lastProcessedAnswer && answer === lastProcessedAnswer) {
                        console.log('API层：workflow_finished答案重复，跳过')
                        continue
                      }
                      lastProcessedAnswer = answer
                    }
                  }
                  
                  if (parsed.event) {
                    console.log('转发事件:', parsed.event)
                  }
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } catch (e) {
                  console.error('解析数据失败:', data, e)
                }
              }
            }
          }

        } catch (error) {
          console.error('流式响应错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat Messages API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '聊天服务暂时不可用' },
      { status: 500 }
    )
  }
}