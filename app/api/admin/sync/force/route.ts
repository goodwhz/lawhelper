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

// POST - 强制同步用户数据
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    console.log('开始强制同步用户数据...')

    // 调用数据库函数强制同步
    const { data: syncResult, error: syncError } = await supabaseService.rpc('force_sync_user_profiles')

    if (syncError) {
      console.error('强制同步失败:', syncError)
      return NextResponse.json({ error: `强制同步失败: ${syncError.message}` }, { status: 500 })
    }

    console.log('强制同步完成，影响用户数:', syncResult?.length || 0)

    // 获取最新的同步状态
    const { data: syncStats, error: statsError } = await supabaseService
      .from('user_sync_stats')
      .select('*')
      .single()

    if (statsError) {
      console.warn('获取同步统计失败:', statsError)
    }

    return NextResponse.json({
      success: true,
      message: `成功同步 ${syncResult?.length || 0} 个用户数据`,
      data: {
        syncedUsers: syncResult?.length || 0,
        stats: syncStats,
      },
    })
  } catch (error) {
    console.error('强制同步错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
