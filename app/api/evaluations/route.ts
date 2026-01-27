import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateEvaluationInput } from '@/types/evaluation'

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少 Supabase 环境变量')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: 获取用户的所有测评记录
export async function GET(request: NextRequest) {
  try {
    // 从请求中获取用户ID
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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 查询用户的测评记录
    const { data: evaluations, error } = await supabase
      .from('evaluation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('查询测评记录失败:', error)
      return NextResponse.json(
        { error: '查询测评记录失败' },
        { status: 500 },
      )
    }

    // 获取总数
    const { count } = await supabase
      .from('evaluation_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      data: evaluations || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('获取测评记录错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    )
  }
}

// POST: 创建新的测评记录
export async function POST(request: NextRequest) {
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

    const body: CreateEvaluationInput = await request.json()

    // 验证必填字段
    if (!body.title || body.total_score === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 },
      )
    }

    // 验证评分范围
    if (body.total_score < 0 || body.total_score > 100) {
      return NextResponse.json(
        { error: '综合评分必须在0-100之间' },
        { status: 400 },
      )
    }

    // 创建测评记录
    const { data: evaluation, error } = await supabase
      .from('evaluation_history')
      .insert({
        user_id: user.id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      console.error('创建测评记录失败:', error)
      return NextResponse.json(
        { error: '创建测评记录失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    }, { status: 201 })
  } catch (error) {
    console.error('创建测评记录错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    )
  }
}
