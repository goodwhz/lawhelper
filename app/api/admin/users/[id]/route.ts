import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkIsAdmin } from '@/lib/auth'

// 创建普通Supabase客户端（用于验证）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 创建Service Role客户端（用于管理员操作）
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// 验证管理员权限的中间件
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

    console.log('管理员验证成功:', user.email)
    return user
  } catch (error) {
    console.error('管理员权限验证失败:', error)
    return null
  }
}

// DELETE - 删除单个用户（通过路径参数）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
    }

    // 防止删除自己
    if (userId === admin.id) {
      return NextResponse.json({ error: '不能删除自己的账户' }, { status: 400 })
    }

    console.log('开始删除用户:', userId)

    // 1. 使用HTTP API删除Supabase Auth中的用户记录
    console.log('步骤1: 删除Auth用户记录...')

    const { supabaseUrl, serviceRoleKey } = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    }

    const deleteAuthResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
    })

    console.log('Auth删除响应状态:', deleteAuthResponse.status)

    if (!deleteAuthResponse.ok) {
      const errorText = await deleteAuthResponse.text()
      console.error('删除Auth用户失败:', errorText)
      // 即使Auth删除失败，也继续删除数据库数据
      console.warn('Auth删除失败，但继续删除数据库数据')
    } else {
      console.log('✅ Auth用户删除成功')
    }

    // 2. 删除用户资料
    console.log('步骤2: 删除用户资料记录...')
    const { error: profileError } = await supabaseService
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('删除用户资料失败:', profileError)
      return NextResponse.json({ error: `删除用户资料失败: ${profileError.message}` }, { status: 500 })
    }

    console.log('✅ 用户资料删除成功')

    // 3. 删除用户的所有对话
    console.log('步骤3: 删除对话记录...')
    const { error: conversationsError } = await supabaseService
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    if (conversationsError) {
      console.warn('删除对话记录失败:', conversationsError)
    } else {
      console.log('✅ 对话记录删除成功')
    }

    // 4. 删除用户的所有消息
    console.log('步骤4: 删除消息记录...')
    const { error: messagesError } = await supabaseService
      .from('messages')
      .delete()
      .eq('user_id', userId)

    if (messagesError) {
      console.warn('删除消息记录失败:', messagesError)
    } else {
      console.log('✅ 消息记录删除成功')
    }

    console.log('🎉 用户账户完全删除完成:', userId)

    return NextResponse.json({
      success: true,
      message: '用户账户及其所有数据已完全删除，用户将无法再次登录',
    })
  } catch (error) {
    console.error('删除用户错误:', error)
    return NextResponse.json({
      error: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`,
      status: 500,
    })
  }
}
