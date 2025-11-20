import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== 环境变量诊断 ===')

    // 检查所有相关环境变量
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : undefined,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...` : undefined,
    }

    console.log('Environment variables:', envVars)

    // 测试基本网络连接
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL 未设置',
        env: envVars,
      }, { status: 500 })
    }

    // 尝试简单的 HTTP 请求测试连接
    try {
      const testResponse = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
      })

      console.log('Supabase HTTP test status:', testResponse.status)
      console.log('Supabase HTTP test ok:', testResponse.ok)

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.log('Supabase HTTP error response:', errorText)

        return NextResponse.json({
          success: false,
          error: `Supabase 连接失败: ${testResponse.status} ${testResponse.statusText}`,
          details: errorText,
          env: envVars,
        }, { status: 500 })
      }
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: `网络连接失败: ${fetchError.message}`,
        env: envVars,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '环境变量和网络连接正常',
      env: envVars,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Diagnosis error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
