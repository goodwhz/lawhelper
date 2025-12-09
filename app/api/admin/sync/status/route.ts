import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkIsAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('Token验证失败:', error)
      return null
    }

    const isAdmin = await checkIsAdmin(user.id)
    if (!isAdmin) {
      console.warn('用户不是管理员:', user.id)
      return null
    }

    return user
  } catch (error) {
    console.error('管理员权限验证失败:', error)
    return null
  }
}

// GET - 获取用户同步状态
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 获取同步统计数据
    const { data: syncStats, error: statsError } = await supabaseService
      .from('user_sync_stats')
      .select('*')
      .single()

    if (statsError) {
      console.error('获取同步统计失败:', statsError)
      return NextResponse.json({
        success: false,
        error: `获取同步统计失败: ${statsError.message}`,
      }, { status: 500 })
    }

    // 获取同步状态详情
    const { data: syncStatus, error: statusError } = await supabaseService
      .from('user_sync_status')
      .select('*')

    if (statusError) {
      console.error('获取同步状态失败:', statusError)
      return NextResponse.json({
        success: false,
        error: `获取同步状态失败: ${statusError.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: syncStats,
        users: syncStatus,
      },
    })
  } catch (error) {
    console.error('获取同步状态错误:', error)
    return NextResponse.json({
      success: false,
      error: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`,
    }, { status: 500 })
  }
}
