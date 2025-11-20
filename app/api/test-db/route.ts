import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('=== 测试数据库连接 ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseKey)
    console.log('Key length:', supabaseKey?.length)

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: '环境变量缺失',
        env: {
          url_exists: !!supabaseUrl,
          key_exists: !!supabaseKey,
        },
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 测试分类查询
    const { data: categories, error: catError } = await supabase
      .from('law_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order')

    // 测试文档查询
    const { data: documents, error: docError } = await supabase
      .from('law_documents')
      .select('id, title')
      .eq('is_published', true)
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        categories: {
          count: categories?.length || 0,
          error: catError?.message,
          data: categories,
        },
        documents: {
          count: documents?.length || 0,
          error: docError?.message,
          data: documents,
        },
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('数据库测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
