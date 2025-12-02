import type { NextRequest } from 'next/server'

const DIFY_API_URL = process.env.DIFY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.DIFY_APP_KEY || process.env.NEXT_PUBLIC_APP_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    console.log('=== 阻塞式聊天API ===')
    console.log('DIFY_API_URL:', DIFY_API_URL)
    console.log('DIFY_APP_KEY exists:', !!DIFY_APP_KEY)

    if (!message || !DIFY_APP_KEY) {
      return new Response(
        JSON.stringify({
          error: '缺少必要参数',
          debug: {
            message: !!message,
            app_key: !!DIFY_APP_KEY,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('调用Dify API...')

    // 调用 Dify API - 阻塞响应
    const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking', // 使用阻塞响应
        conversation_id: conversation_id || null,
        user: user_id || `user_${Date.now()}`,
        auto_generate_name: true,
      }),
    })

    console.log('Dify响应状态:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Dify API error:', errorData)
      throw new Error(`Dify API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Dify响应数据:', data)

    return new Response(
      JSON.stringify({
        answer: data.answer,
        message_id: data.message_id,
        conversation_id: data.conversation_id,
        metadata: data.metadata,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '聊天服务暂时不可用',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
