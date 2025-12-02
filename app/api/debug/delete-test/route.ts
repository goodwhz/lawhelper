import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== Delete API Debug Started ===')

  try {
    // 检查环境变量
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing')
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing')
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing')

    // 测试JSON解析
    const body = await request.json()
    console.log('Request body parsed successfully:', body)

    return NextResponse.json({
      success: true,
      message: 'Debug test passed',
      env: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        type: error.constructor.name,
      },
      { status: 500 },
    )
  }
}
