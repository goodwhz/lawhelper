import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 数据库初始化 SQL（注释掉未使用的常量以满足ESLint要求）
// const _INIT_SQL = `
// -- 创建法律分类表
// CREATE TABLE IF NOT EXISTS law_categories (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   name TEXT NOT NULL,
//   sort_order INTEGER DEFAULT 0,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
// );
//
// -- 创建法律文档表
// CREATE TABLE IF NOT EXISTS law_documents (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   title TEXT NOT NULL,
//   content TEXT,
//   category_id UUID REFERENCES law_categories(id) ON DELETE CASCADE,
//   document_type TEXT DEFAULT 'law',
//   document_number TEXT,
//   publish_date DATE,
//   effective_date DATE,
//   expire_date DATE,
//   file_path TEXT,
//   file_size BIGINT,
//   file_type TEXT,
//   download_count INTEGER DEFAULT 0,
//   view_count INTEGER DEFAULT 0,
//   is_published BOOLEAN DEFAULT true,
//   is_featured BOOLEAN DEFAULT false,
//   keywords TEXT[],
//   tags TEXT[],
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
// );
//
// -- 插入基础分类数据
// INSERT INTO law_categories (name, sort_order) VALUES
// ('劳动法律', 1),
// ('社会保障', 2),
// ('就业指导', 3),
// ('劳动争议', 4),
// ('职业安全', 5)
// ON CONFLICT DO NOTHING;
//
// -- 创建索引
// CREATE INDEX IF NOT EXISTS idx_law_documents_category_id ON law_documents(category_id);
// CREATE INDEX IF NOT EXISTS idx_law_documents_published ON law_documents(is_published);
//
// -- 启用 RLS (Row Level Security)
// ALTER TABLE law_categories ENABLE ROW LEVEL SECURITY;
// ALTER TABLE law_documents ENABLE ROW LEVEL SECURITY;
//
// -- 创建 RLS 策略
// CREATE POLICY "Anyone can view published law_categories" ON law_categories
//   FOR SELECT USING (true);
//
// CREATE POLICY "Anyone can view published law_documents" ON law_documents
//   FOR SELECT USING (is_published = true);
//
// -- 给匿名用户权限
// GRANT USAGE ON SCHEMA public TO anon;
// GRANT SELECT ON law_categories TO anon;
// GRANT SELECT ON law_documents TO anon;
// `

export async function POST() {
  try {
    console.log('=== 开始初始化数据库 ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 环境变量缺失')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 执行初始化 SQL - 注意：这里需要使用 service role key，但为了演示我们只检查表
    console.log('检查表是否存在...')

    // 检查分类表
    const { data: _categoriesCheck, error: categoriesError } = await supabase
      .from('law_categories')
      .select('count')
      .limit(1)

    if (categoriesError) {
      console.error('law_categories 表检查失败:', categoriesError)
      return NextResponse.json({
        success: false,
        error: 'law_categories 表不存在或无法访问',
        details: categoriesError.message,
      }, { status: 500 })
    }

    // 检查文档表
    const { data: _documentsCheck, error: documentsError } = await supabase
      .from('law_documents')
      .select('count')
      .limit(1)

    if (documentsError) {
      console.error('law_documents 表检查失败:', documentsError)
      return NextResponse.json({
        success: false,
        error: 'law_documents 表不存在或无法访问',
        details: documentsError.message,
      }, { status: 500 })
    }

    // 检查是否有分类数据
    const { data: categoriesData, error: categoriesDataError } = await supabase
      .from('law_categories')
      .select('*')
      .limit(5)

    if (categoriesDataError) {
      console.error('获取分类数据失败:', categoriesDataError)
    }

    console.log('=== 数据库初始化检查完成 ===')
    console.log('law_categories 表: 正常')
    console.log('law_documents 表: 正常')
    console.log(`分类数据数量: ${categoriesData?.length || 0}`)

    return NextResponse.json({
      success: true,
      message: '数据库表结构检查完成',
      data: {
        tables: {
          law_categories: '正常',
          law_documents: '正常',
        },
        categories_count: categoriesData?.length || 0,
        needs_setup: (categoriesData?.length || 0) === 0,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('数据库初始化检查失败:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
      message: '数据库初始化检查失败',
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
