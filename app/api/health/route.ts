import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const startTime = Date.now()

    // 检查环境变量
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    }

    // 测试Supabase连接
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // 简单的连接测试
    const { data, error } = await supabase
      .from('law_categories')
      .select('count')
      .limit(1)

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase连接失败',
        error: error.message,
        env: envCheck,
        timestamp: new Date().toISOString(),
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    }

    return NextResponse.json({
      status: 'healthy',
      message: '所有系统运行正常',
      env: envCheck,
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        categoriesCount: data?.[0]?.count || 0,
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
      },
    })
  } catch (error: any) {
    console.error('Health check error:', error)

    return NextResponse.json({
      status: 'error',
      message: '健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  }
}

// 支持OPTIONS请求用于CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
