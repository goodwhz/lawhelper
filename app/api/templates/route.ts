import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // 查询已发布的模板
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('查询模板失败:', error)
      return NextResponse.json({ error: '查询模板失败' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}