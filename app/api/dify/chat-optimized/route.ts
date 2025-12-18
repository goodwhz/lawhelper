import type { NextRequest } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

// 连接池和超时配置
const API_CONFIG = {
  timeout: 10000, // 10秒超时
  maxRetries: 2,
  retryDelay: 1000, // 1秒重试延迟
}

// 创建AbortController的超时版本
const createTimeoutController = (timeout: number) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  return { controller, timeoutId }
}

// 优化的fetch函数，支持超时和重试
const optimizedFetch = async (url: string, options: RequestInit, retries = API_CONFIG.maxRetries) => {
  const { controller, timeoutId } = createTimeoutController(API_CONFIG.timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError' && retries > 0) {
      console.log(`请求超时，剩余重试次数: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay))
      return optimizedFetch(url, options, retries - 1)
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { message, conversation_id, user_id } = await request.json()

    // 快速参数验证
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: '消息内容不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!DIFY_APP_KEY) {
      return new Response(
        JSON.stringify({ error: 'API密钥未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 构建请求体
    const requestBody = {
      inputs: {},
      query: message.trim(),
      response_mode: 'streaming' as const,
      conversation_id: conversation_id || undefined,
      user: user_id || `user_${Date.now()}`,
      auto_generate_name: true,
    }

    // 构建API URL
    const apiUrl = DIFY_API_URL.endsWith('/v1')
      ? `${DIFY_API_URL}/chat-messages`
      : `${DIFY_API_URL}/v1/chat-messages`

    // 请求头
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${DIFY_APP_KEY}`,
      'Content-Type': 'application/json',
    }

    if (process.env.NEXT_PUBLIC_APP_ID) {
      headers['X-App-Id'] = process.env.NEXT_PUBLIC_APP_ID
    }

    // 调用Dify API
    const response = await optimizedFetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API错误:', { status: response.status, error: errorText })

      return new Response(
        JSON.stringify({
          error: 'AI服务暂时不可用',
          status: response.status,
          details: errorText.substring(0, 200),
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 创建优化的流式响应
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('无法获取响应流')
          }

          let buffer = ''
          let _messageId = ''
          let _conversationId = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) { break }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))

                  // 记录性能指标
                  const endTime = Date.now()
                  console.log(`✅ 流式响应完成，耗时: ${endTime - startTime}ms`)

                  return
                }

                try {
                  const parsed = JSON.parse(data)

                  // 提取关键信息
                  if (parsed.message_id) { _messageId = parsed.message_id }
                  if (parsed.conversation_id) { _conversationId = parsed.conversation_id }

                  // 优化：只传输必要的数据
                  const optimizedData = {
                    answer: parsed.answer,
                    message_id: parsed.message_id,
                    conversation_id: parsed.conversation_id,
                    event: parsed.event,
                  }

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(optimizedData)}\n\n`))
                } catch (e) {
                  console.warn('解析数据失败:', data)
                }
              }
            }
          }
        } catch (error) {
          console.error('流式响应错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '流式响应中断' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    })
  } catch (error) {
    const endTime = Date.now()
    console.error('API处理错误:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '服务异常',
        responseTime: `${endTime - startTime}ms`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

// 导出运行时配置 - 使用新的导出方式
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
