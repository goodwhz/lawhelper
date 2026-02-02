/**
 * 牛马测评仪 - 消息管理 API
 * GET: 获取测评的消息列表
 * POST: 创建新消息
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'

// GET 获取消息列表
export async function GET(
  request: NextRequest,
  { params }: { params: { evaluationId: string } },
) {
  try {
    const userResult = await safeGetUser()
    if (!userResult.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      )
    }

    const user = userResult.user
    const { evaluationId } = params

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 验证测评属于当前用户
    const { error: evalError } = await supabase
      .from('niuma_evaluations')
      .select('id')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .single()

    if (evalError || !evalError) {
      return NextResponse.json(
        { success: false, error: '测评不存在' },
        { status: 404 },
      )
    }

    // 获取消息列表
    const { data, error } = await supabase
      .from('niuma_evaluation_messages')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取消息失败:', error)
      return NextResponse.json(
        { success: false, error: '获取消息失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: data || [],
        limit,
        offset,
      },
    })
  } catch (error: any) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 },
    )
  }
}

// POST 创建新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { evaluationId: string } },
) {
  try {
    const userResult = await safeGetUser()
    if (!userResult.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      )
    }

    const user = userResult.user
    const { evaluationId } = params
    const body = await request.json()

    const { content, role, coze_message_id, message_data } = body

    // 验证必填字段
    if (!content || !role) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 },
      )
    }

    // 验证角色
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '无效的消息角色' },
        { status: 400 },
      )
    }

    // 验证测评属于当前用户
    const { error: evalError } = await supabase
      .from('niuma_evaluations')
      .select('id, version')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .single()

    if (evalError || !evalError) {
      return NextResponse.json(
        { success: false, error: '测评不存在' },
        { status: 404 },
      )
    }

    // 创建消息
    const { data, error } = await supabase
      .from('niuma_evaluation_messages')
      .insert({
        evaluation_id: evaluationId,
        user_id: user.id,
        content,
        role,
        coze_message_id,
        message_data: message_data || {},
      })
      .select()
      .single()

    if (error) {
      console.error('创建消息失败:', error)
      return NextResponse.json(
        { success: false, error: '创建消息失败' },
        { status: 500 },
      )
    }

    // 更新测评的 last_activity_at
    await supabase
      .from('niuma_evaluations')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', evaluationId)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 },
    )
  }
}
