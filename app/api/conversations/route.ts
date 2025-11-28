import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '100'
    const first_id = searchParams.get('first_id') || ''
    
    console.log('=== 获取对话列表 ===')
    console.log('Limit:', limit, 'First ID:', first_id)

    const queryParams = new URLSearchParams({
      limit,
      ...(first_id && { first_id })
    })

    const response = await fetch(`${DIFY_API_URL}/conversations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('获取对话列表失败:', errorText)
      throw new Error(`获取对话列表失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('对话列表获取成功:', data.data?.length || 0, '个对话')

    return NextResponse.json(data)

  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取对话列表失败' },
      { status: 500 }
    )
  }
}