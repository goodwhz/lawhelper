import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const DIFY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dify.aipfuture.com/v1'
const DIFY_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    // 在Next.js 15+中，params是异步的
    const { messageId } = await params
    const body = await request.json()

    console.log('=== 提交反馈 ===')
    console.log('Message ID:', messageId)

    const response = await fetch(`${DIFY_API_URL}/messages/${messageId}/feedbacks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('提交反馈失败:', errorText)
      throw new Error(`提交反馈失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('反馈提交成功')

    return NextResponse.json(data)
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '提交反馈失败' },
      { status: 500 },
    )
  }
}
