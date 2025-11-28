import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function GET() {
  return NextResponse.json({
    difyUrl: DIFY_API_URL,
    hasAppKey: !!DIFY_APP_KEY,
    appKeyLength: DIFY_APP_KEY?.length || 0,
    envVars: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_KEY: process.env.NEXT_PUBLIC_APP_KEY ? 'exists' : 'missing',
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 测试 Dify API ===')
    console.log('DIFY_API_URL:', DIFY_API_URL)
    console.log('DIFY_APP_KEY exists:', !!DIFY_APP_KEY)
    console.log('DIFY_APP_KEY length:', DIFY_APP_KEY?.length)

    const { message } = await request.json()
    
    if (!message || !DIFY_APP_KEY) {
      return NextResponse.json(
        { error: '缺少必要参数', hasAppKey: !!DIFY_APP_KEY },
        { status: 400 }
      )
    }

    console.log('发送消息到 Dify:', message)

    const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking',
        conversation_id: null,
        user: 'test_user',
        auto_generate_name: true,
      }),
    })

    console.log('Dify 响应状态:', response.status)
    console.log('Dify 响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API 错误响应:', errorText)
      throw new Error(`Dify API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Dify API 成功响应，数据长度:', JSON.stringify(data).length)

    return NextResponse.json({
      success: true,
      answer: data.answer?.slice(0, 100) + '...',
      messageId: data.id,
      conversationId: data.conversation_id,
    })

  } catch (error) {
    console.error('=== Dify 测试 API 错误 ===')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '未知错误',
        type: error.constructor.name,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}