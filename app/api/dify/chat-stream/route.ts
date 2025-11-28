import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    if (!message || !DIFY_APP_KEY) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
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
            
            if (done) break
            
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
                  if (parsed.message_id) messageId = parsed.message_id
                  if (parsed.conversation_id) conversationId = parsed.conversation_id

                  // 转发数据到客户端
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))

                } catch (e) {
                  console.error('解析数据失败:', data, e)
                }
              }
            }
          }

          // 流结束后保存到数据库
          if (user_id && messageId) {
            try {
              console.log('保存消息到数据库:', { user_id, messageId, conversationId })
              
              // 这里可以根据需要保存会话信息到conversations表
              if (conversationId && !conversation_id) {
                await supabase
                  .from('conversations')
                  .upsert({
                    user_id,
                    dify_conversation_id: conversationId,
                    title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                    last_activity_at: new Date().toISOString()
                  })
              }

            } catch (dbError) {
              console.error('保存到数据库失败:', dbError)
            }
          }

        } catch (error) {
          console.error('流式响应错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '流式响应错误' })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '聊天服务暂时不可用' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}