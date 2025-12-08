import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('开始测试数据加载...')

    // 测试分类表
    const { data: categories, error: categoriesError } = await supabase
      .from('law_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    console.log('分类查询结果:', { categories, error: categoriesError })

    // 测试文档表
    const { data: documents, error: documentsError } = await supabase
      .from('law_documents')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('文档查询结果:', { documents, error: documentsError })

    // 测试对话表
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('对话查询结果:', { conversations, error: conversationsError })

    // 测试用户档案表
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)

    console.log('用户档案查询结果:', { profiles, error: profilesError })

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        documents: documents || [],
        conversations: conversations || [],
        profiles: profiles || [],
        counts: {
          categories: categories?.length || 0,
          documents: documents?.length || 0,
          conversations: conversations?.length || 0,
          profiles: profiles?.length || 0,
        },
      },
      errors: {
        categories: categoriesError?.message,
        documents: documentsError?.message,
        conversations: conversationsError?.message,
        profiles: profilesError?.message,
      },
    })
  } catch (error) {
    console.error('测试数据加载失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
