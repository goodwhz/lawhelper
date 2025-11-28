import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 等待params解析
    const { id } = await params

    // 从数据库获取文档内容
    const { data: document, error } = await supabase
      .from('law_documents')
      .select('title, content')
      .eq('id', id)
      .single()

    if (error) {
      console.error('数据库查询失败:', error)
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    // 返回文档内容
    return NextResponse.json({
      title: document.title,
      content: document.content,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('获取文档内容错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
