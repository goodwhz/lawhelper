/**
 * 牛马测评仪 - 测评列表 API
 * GET: 获取用户的所有测评
 * POST: 创建新测评
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'

// GET 获取测评列表
export async function GET(request: NextRequest) {
  try {
    const userResult = await safeGetUser()
    if (!userResult.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      )
    }

    const user = userResult.user

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'active'
    const version = searchParams.get('version')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 构建查询
    let query = supabase
      .from('niuma_evaluations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // 添加状态过滤
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 添加版本过滤
    if (version && ['simple', 'normal'].includes(version)) {
      query = query.eq('version', version)
    }

    // 执行查询
    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取测评列表失败:', error)
      return NextResponse.json(
        { success: false, error: '获取测评列表失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluations: data || [],
        count: count || 0,
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

// POST 创建新测评
export async function POST(request: NextRequest) {
  try {
    const userResult = await safeGetUser()
    if (!userResult.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      )
    }

    const user = userResult.user
    const body = await request.json()

    const { title, version, metadata, settings } = body

    // 验证版本
    if (version && !['simple', 'normal'].includes(version)) {
      return NextResponse.json(
        { success: false, error: '无效的版本类型' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('niuma_evaluations')
      .insert({
        user_id: user.id,
        title: title || '新测评',
        version: version || 'normal',
        metadata: metadata || {},
        settings: settings || {},
      })
      .select()
      .single()

    if (error) {
      console.error('创建测评失败:', error)
      return NextResponse.json(
        { success: false, error: '创建测评失败' },
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
