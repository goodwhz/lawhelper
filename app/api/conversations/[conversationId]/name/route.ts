import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params
    const body = await request.json()
    
    console.log('=== 生成对话名称 ===')
    console.log('Conversation ID:', conversationId)

    const response = await fetch(`${DIFY_API_URL}/conversations/${conversationId}/name`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('生成对话名称失败:', errorText)
      throw new Error(`生成对话名称失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('对话名称生成成功')

    return NextResponse.json(data)

  } catch (error) {
    console.error('Conversation Name API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成对话名称失败' },
      { status: 500 }
    )
  }
}