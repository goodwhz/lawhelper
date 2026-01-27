import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少 Supabase 环境变量')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: 获取单个测评记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '无效的授权令牌' },
        { status: 401 },
      )
    }

    const { data: evaluation, error } = await supabase
      .from('evaluation_history')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !evaluation) {
      return NextResponse.json(
        { error: '测评记录不存在或无权访问' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    })
  } catch (error) {
    console.error('获取测评记录详情错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    )
  }
}

// DELETE: 删除测评记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '无效的授权令牌' },
        { status: 401 },
      )
    }

    const { error } = await supabase
      .from('evaluation_history')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('删除测评记录失败:', error)
      return NextResponse.json(
        { error: '删除测评记录失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除测评记录错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    )
  }
}

// PUT: 更新测评记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '无效的授权令牌' },
        { status: 401 },
      )
    }

    const body = await request.json()

    const { data: evaluation, error } = await supabase
      .from('evaluation_history')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !evaluation) {
      console.error('更新测评记录失败:', error)
      return NextResponse.json(
        { error: '更新测评记录失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    })
  } catch (error) {
    console.error('更新测评记录错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    )
  }
}
