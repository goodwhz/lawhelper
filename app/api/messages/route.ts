import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversation_id = searchParams.get('conversation_id')
    const limit = searchParams.get('limit') || '20'
    const last_id = searchParams.get('last_id') || ''
    
    console.log('=== 获取消息列表 ===')
    console.log('Conversation ID:', conversation_id)

    if (!conversation_id) {
      return NextResponse.json(
        { error: '缺少conversation_id参数' },
        { status: 400 }
      )
    }

    const queryParams = new URLSearchParams({
      conversation_id,
      limit,
      ...(last_id && { last_id })
    })

    const response = await fetch(`${DIFY_API_URL}/messages?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('获取消息列表失败:', errorText)
      throw new Error(`获取消息列表失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('消息列表获取成功:', data.data?.length || 0, '条消息')

    return NextResponse.json(data)

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取消息列表失败' },
      { status: 500 }
    )
  }
}