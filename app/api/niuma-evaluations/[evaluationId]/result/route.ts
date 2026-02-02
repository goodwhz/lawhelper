/**
 * 牛马测评仪 - 测评结果 API
 * GET: 获取测评结果
 * POST: 保存测评结果
 * PUT: 更新测评结果
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'

// GET 获取测评结果
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

    // 验证测评属于当前用户
    const { error: evalError } = await supabase
      .from('niuma_evaluations')
      .select('id')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .single()

    if (evalError) {
      return NextResponse.json(
        { success: false, error: '测评不存在' },
        { status: 404 },
      )
    }

    // 获取测评结果
    const { data, error } = await supabase
      .from('niuma_evaluation_results')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .single()

    if (error) {
      // PGRST116 表示没有结果
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
        })
      }

      console.error('获取测评结果失败:', error)
      return NextResponse.json(
        { success: false, error: '获取测评结果失败' },
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

// POST 保存测评结果
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

    const {
      total_score,
      salary_score,
      workload_score,
      growth_score,
      environment_score,
      atmosphere_score,
      mental_health_score,
      evaluation_summary,
      suggestions,
      dimensions,
    } = body

    // 验证测评属于当前用户
    const { error: evalError } = await supabase
      .from('niuma_evaluations')
      .select('id')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .single()

    if (evalError) {
      return NextResponse.json(
        { success: false, error: '测评不存在' },
        { status: 404 },
      )
    }

    // 保存测评结果
    const { data, error } = await supabase
      .from('niuma_evaluation_results')
      .insert({
        evaluation_id: evaluationId,
        user_id: user.id,
        total_score,
        salary_score,
        workload_score,
        growth_score,
        environment_score,
        atmosphere_score,
        mental_health_score,
        evaluation_summary,
        suggestions,
        dimensions: dimensions || {},
      })
      .select()
      .single()

    if (error) {
      console.error('保存测评结果失败:', error)
      return NextResponse.json(
        { success: false, error: '保存测评结果失败' },
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

// PUT 更新测评结果
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

    const { evaluationId } = params
    const body = await request.json()

    // 构建更新对象
    const updates: any = {}
    if (body.total_score !== undefined) { updates.total_score = body.total_score }
    if (body.salary_score !== undefined) { updates.salary_score = body.salary_score }
    if (body.workload_score !== undefined) { updates.workload_score = body.workload_score }
    if (body.growth_score !== undefined) { updates.growth_score = body.growth_score }
    if (body.environment_score !== undefined) { updates.environment_score = body.environment_score }
    if (body.atmosphere_score !== undefined) { updates.atmosphere_score = body.atmosphere_score }
    if (body.mental_health_score !== undefined) { updates.mental_health_score = body.mental_health_score }
    if (body.evaluation_summary !== undefined) { updates.evaluation_summary = body.evaluation_summary }
    if (body.suggestions !== undefined) { updates.suggestions = body.suggestions }
    if (body.dimensions !== undefined) { updates.dimensions = body.dimensions }

    const { data, error } = await supabase
      .from('niuma_evaluation_results')
      .update(updates)
      .eq('evaluation_id', evaluationId)
      .select()
      .single()

    if (error) {
      console.error('更新测评结果失败:', error)
      return NextResponse.json(
        { success: false, error: '更新测评结果失败' },
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
