import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    console.log('=== 开始环境检查 ===')

    // 检查环境变量
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_KEY_EXISTS: !!process.env.NEXT_PUBLIC_APP_KEY,
      NEXT_PUBLIC_APP_KEY_LENGTH: process.env.NEXT_PUBLIC_APP_KEY?.length,
      NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    console.log('环境变量检查结果:', envVars)

    // 测试Supabase连接
    let supabaseTest = { success: false, error: null }
    try {
      const { createClient } = await import('@supabase/supabase-js')

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase 环境变量缺失')
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )

      // 测试数据库连接
      const { data, error } = await supabase
        .from('law_categories')
        .select('count')
        .limit(1)

      if (error) {
        throw error
      }

      supabaseTest = { success: true, error: null }
    } catch (error: any) {
      supabaseTest = {
        success: false,
        error: error.message || 'Unknown error',
      }
    }

    // 检查数据库表结构
    const tableCheck = { categories: false, documents: false }
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // 检查分类表
      const { data: _categories } = await supabase
        .from('law_categories')
        .select('id')
        .limit(1)

      tableCheck.categories = !!_categories

      // 检查文档表
      const { data: _documents } = await supabase
        .from('law_documents')
        .select('id')
        .limit(1)

      tableCheck.documents = !!_documents
    } catch (error) {
      console.error('表结构检查失败:', error)
    }

    // 检查Dify API连接
    let difyTest = { success: false, error: null, response: null }
    try {
      if (!process.env.NEXT_PUBLIC_API_URL || !process.env.NEXT_PUBLIC_APP_KEY) {
        throw new Error('Dify API 环境变量缺失')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_APP_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: '健康检查测试',
          response_mode: 'blocking',
          user: 'health_check',
        }),
        signal: AbortSignal.timeout(10000), // 10秒超时
      })

      if (response.ok) {
        const data = await response.json()
        difyTest = { 
          success: true, 
          error: null, 
          response: {
            status: response.status,
            hasAnswer: !!data.answer,
            answerLength: data.answer?.length || 0,
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      difyTest = {
        success: false,
        error: error.message || 'Unknown error',
        response: null,
      }
    }

    const healthStatus = {
      status: (envVars.NEXT_PUBLIC_SUPABASE_URL && supabaseTest.success && difyTest.success) ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: envVars,
      supabase: supabaseTest,
      database: tableCheck,
      dify: difyTest,
      recommendations: [],
    }

    // 生成建议
    if (!envVars.NEXT_PUBLIC_SUPABASE_URL) {
      healthStatus.recommendations.push('NEXT_PUBLIC_SUPABASE_URL 环境变量未设置')
    }

    if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS) {
      healthStatus.recommendations.push('NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量未设置')
    }

    if (!supabaseTest.success) {
      healthStatus.recommendations.push(`Supabase 连接失败: ${supabaseTest.error}`)
    }

    if (!tableCheck.categories) {
      healthStatus.recommendations.push('law_categories 表不存在或无法访问')
    }

    if (!tableCheck.documents) {
      healthStatus.recommendations.push('law_documents 表不存在或无法访问')
    }

    if (!envVars.NEXT_PUBLIC_API_URL) {
      healthStatus.recommendations.push('NEXT_PUBLIC_API_URL 环境变量未设置')
    }

    if (!envVars.NEXT_PUBLIC_APP_KEY_EXISTS) {
      healthStatus.recommendations.push('NEXT_PUBLIC_APP_KEY 环境变量未设置')
    }

    if (!difyTest.success) {
      healthStatus.recommendations.push(`Dify API 连接失败: ${difyTest.error}`)
    }

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'healthy' ? 200 : 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('健康检查失败:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
