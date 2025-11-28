import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log('=== 模拟 Dify API ===')
    console.log('收到消息:', message)
    console.log('用户ID:', user_id)
    console.log('对话ID:', conversation_id)

    // 模拟AI回复延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockResponse = {
      answer: `这是一个模拟的AI回复。\n\n您的问题是："${message}"\n\n这是一个测试回复，用于验证聊天界面的功能。实际使用时，需要配置正确的Dify API密钥来获得真正的AI回复。`,
      message_id: `msg_${Date.now()}`,
      conversation_id: conversation_id || `conv_${Date.now()}`,
      metadata: {},
      message_files: [],
      agent_thoughts: [],
      citation: [],
      more: {},
      annotation: null,
    }

    console.log('返回模拟响应:', mockResponse.message_id)

    return NextResponse.json(mockResponse)

  } catch (error) {
    console.error('Mock Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '聊天服务暂时不可用' },
      { status: 500 }
    )
  }
}