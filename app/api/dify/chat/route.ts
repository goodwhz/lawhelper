import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    if (!message || !DIFY_APP_KEY) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 调用 Dify API
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

    const data = await response.json()

    // 保存消息到数据库（如果需要的话）
    // 这部分逻辑移到了客户端的hook中处理

    return NextResponse.json({
      answer: data.answer,
      message_id: data.id,
      conversation_id: data.conversation_id,
      metadata: data.metadata,
      message_files: data.message_files || [],
      agent_thoughts: data.agent_thoughts || [],
      citation: data.citation || [],
      more: data.more || {},
      annotation: data.annotation || null,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '聊天服务暂时不可用' },
      { status: 500 }
    )
  }
}