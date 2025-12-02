import type { NextRequest } from 'next/server'

const DIFY_API_URL = process.env.DIFY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.DIFY_APP_KEY || process.env.NEXT_PUBLIC_APP_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    console.log('=== API环境变量检查 ===')
    console.log('DIFY_API_URL:', DIFY_API_URL)
    console.log('DIFY_APP_KEY exists:', !!DIFY_APP_KEY)
    console.log('DIFY_APP_KEY length:', DIFY_APP_KEY?.length)

    if (!message || !DIFY_APP_KEY) {
      return new Response(
        JSON.stringify({
          error: '缺少必要参数',
          debug: {
            message: !!message,
            app_key: !!DIFY_APP_KEY,
            app_key_length: DIFY_APP_KEY?.length,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('=== 开始流式聊天 ===')
    console.log('User ID:', user_id)
    console.log('Message:', message)
    console.log('Conversation ID:', conversation_id)

    // 调用 Dify API - 流式响应
    const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'streaming', // 使用流式响应
        conversation_id: conversation_id || null,
        user: user_id || `user_${Date.now()}`,
        auto_generate_name: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Dify API error:', errorData)

      // 如果是HTML错误页面，说明是网络问题或服务不可用
      if (errorData.includes('<!DOCTYPE')) {
        return new Response(
          JSON.stringify({
            error: 'Dify服务暂时不可用，请稍后重试',
            details: '网络连接问题或服务维护中',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      throw new Error(`Dify API error: ${response.status}`)
    }

    console.log('Dify API 响应成功，开始流式传输')

    // 设置流式响应
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
          let messageId = ''
          let conversationId = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) { break }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后一个不完整的行

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // 流结束
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  console.log('收到数据:', parsed)

                  // 提取消息ID和对话ID
                  if (parsed.message_id) { messageId = parsed.message_id }
                  if (parsed.conversation_id) { conversationId = parsed.conversation_id }

                  // 转发数据到客户端
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`))
                } catch (e) {
                  console.error('解析数据失败:', data, e)
                }
              }
            }
          }

          // 流结束后只记录日志，不创建新的对话记录
          if (user_id && messageId) {
            console.log('消息已保存:', { user_id, messageId, conversationId })
            console.log('Dify对话ID已关联到现有对话')
          }
        } catch (error) {
          console.error('流式响应错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '流式响应错误' })}\n\n`))
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '聊天服务暂时不可用',
        details: '请检查网络连接或稍后重试',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
