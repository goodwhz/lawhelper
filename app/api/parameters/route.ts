import { NextRequest, NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function GET(request: NextRequest) {
  try {
    console.log('=== 获取应用参数 ===')

    const response = await fetch(`${DIFY_API_URL}/parameters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('获取应用参数失败:', errorText)
      throw new Error(`获取应用参数失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('应用参数获取成功')

    return NextResponse.json(data)

  } catch (error) {
    console.error('Parameters API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取应用参数失败' },
      { status: 500 }
    )
  }
}