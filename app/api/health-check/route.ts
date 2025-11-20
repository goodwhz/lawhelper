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

    const healthStatus = {
      status: envVars.NEXT_PUBLIC_SUPABASE_URL && supabaseTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: envVars,
      supabase: supabaseTest,
      database: tableCheck,
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

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
