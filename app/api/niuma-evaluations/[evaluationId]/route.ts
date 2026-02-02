/**
 * 牛马测评仪 - 单个测评 API
 * GET: 获取测评详情（包含消息）
 * PUT: 更新测评信息
 * DELETE: 删除测评
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'

// GET 获取测评详情
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

    // 并行获取测评、消息和结果
    const [evaluationResult, messagesResult, resultResult] = await Promise.all([
      supabase
        .from('niuma_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .eq('user_id', user.id)
        .single(),

      supabase
        .from('niuma_evaluation_messages')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: true }),

      supabase
        .from('niuma_evaluation_results')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .single(),
    ])

    // 检查测评是否存在
    if (evaluationResult.error || !evaluationResult.data) {
      return NextResponse.json(
        { success: false, error: '测评不存在' },
        { status: 404 },
      )
    }

    if (messagesResult.error) {
      console.error('获取消息失败:', messagesResult.error)
    }

    // 结果可能不存在
    const result = resultResult.error || !resultResult.data ? null : resultResult.data

    return NextResponse.json({
      success: true,
      data: {
        evaluation: evaluationResult.data,
        messages: messagesResult.data || [],
        result,
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

// PUT 更新测评信息
export async function PUT(
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

    const { title, status, metadata, settings } = body

    // 构建更新对象
    const updates: any = {
      last_activity_at: new Date().toISOString(),
    }
    if (title !== undefined) { updates.title = title }
    if (status !== undefined && ['active', 'archived', 'deleted'].includes(status)) {
      updates.status = status
    }
    if (metadata !== undefined) { updates.metadata = metadata }
    if (settings !== undefined) { updates.settings = settings }

    const { data, error } = await supabase
      .from('niuma_evaluations')
      .update(updates)
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      console.error('更新测评失败:', error)
      return NextResponse.json(
        { success: false, error: '更新测评失败' },
        { status: 500 },
      )
    }

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

// DELETE 删除测评
export async function DELETE(
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

    // 软删除：设置 status 为 deleted
    const { error } = await supabase
      .from('niuma_evaluations')
      .update({ status: 'deleted' })
      .eq('id', evaluationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('删除测评失败:', error)
      return NextResponse.json(
        { success: false, error: '删除测评失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: '测评已删除',
    })
  } catch (error: any) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 },
    )
  }
}
