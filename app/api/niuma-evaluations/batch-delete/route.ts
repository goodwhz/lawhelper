/**
 * 牛马测评仪 - 批量删除 API
 * POST: 批量删除多个测评
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'

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
    const { evaluationIds } = body

    if (!Array.isArray(evaluationIds) || evaluationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '无效的测评ID列表' },
        { status: 400 },
      )
    }

    // 批量软删除
    const { error } = await supabase
      .from('niuma_evaluations')
      .update({ status: 'deleted' })
      .in('id', evaluationIds)
      .eq('user_id', user.id)

    if (error) {
      console.error('批量删除失败:', error)
      return NextResponse.json(
        { success: false, error: '批量删除失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `已删除 ${evaluationIds.length} 个测评`,
    })
  } catch (error: any) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 },
    )
  }
}
