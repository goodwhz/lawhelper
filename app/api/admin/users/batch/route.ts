import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkIsAdmin } from '@/lib/auth'

// 创建普通Supabase客户端（用于验证）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 创建Service Role客户端（用于管理员操作）
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// POST - 批量操作用户
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { action, userIds, role } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    // 防止操作自己
    if (userIds.includes(admin.id)) {
      return NextResponse.json({ error: '不能对自己的账户执行批量操作' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'updateRole':
        if (!role || !['user', 'admin'].includes(role)) {
          return NextResponse.json({ error: '无效的用户角色' }, { status: 400 })
        }

        const { data: updatedUsers, error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            role, 
            updated_at: new Date().toISOString() 
          })
          .in('id', userIds)
          .select()

        if (updateError) {
          console.error('批量更新用户角色失败:', updateError)
          return NextResponse.json({ error: '批量更新失败' }, { status: 500 })
        }

        result = {
          success: true,
          message: `成功更新 ${updatedUsers?.length || 0} 个用户的角色`,
          users: updatedUsers
        }
        break

      case 'delete':
        console.log('开始批量删除用户:', userIds)
        
        // 1. 批量删除Auth用户记录（使用与用户自删除相同的方法）
        console.log('步骤1: 批量删除Auth用户记录...')
        
        const { supabaseUrl, serviceRoleKey } = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
        }
        
        for (const userId of userIds) {
          const deleteAuthResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
          })
          
          if (!deleteAuthResponse.ok) {
            const errorText = await deleteAuthResponse.text()
            console.warn(`删除Auth用户失败 ${userId}:`, errorText)
          } else {
            console.log(`✅ Auth用户删除成功: ${userId}`)
          }
        }

        // 2. 批量删除对话数据
        console.log('步骤2: 批量删除对话记录...')
        const { error: conversationsError } = await supabaseService
          .from('conversations')
          .delete()
          .in('user_id', userIds)

        if (conversationsError) {
          console.warn('批量删除对话记录失败:', conversationsError)
        } else {
          console.log('✅ 对话记录批量删除成功')
        }

        // 3. 批量删除消息数据
        console.log('步骤3: 批量删除消息记录...')
        const { error: messagesError } = await supabaseService
          .from('messages')
          .delete()
          .in('user_id', userIds)

        if (messagesError) {
          console.warn('批量删除消息记录失败:', messagesError)
        } else {
          console.log('✅ 消息记录批量删除成功')
        }

        // 4. 批量删除用户资料
        console.log('步骤4: 批量删除用户资料记录...')
        const { error: deleteProfileError } = await supabaseService
          .from('user_profiles')
          .delete()
          .in('id', userIds)

        if (deleteProfileError) {
          console.error('批量删除用户资料失败:', deleteProfileError)
          return NextResponse.json({ error: '批量删除失败: ' + deleteProfileError.message }, { status: 500 })
        }

        console.log('✅ 用户资料批量删除成功')
        console.log('🎉 批量用户账户完全删除完成')

        result = {
          success: true,
          message: `成功删除 ${userIds.length} 个用户账户及其所有数据，这些用户将无法再次登录`,
          deletedCount: userIds.length
        }
        break

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('批量操作用户错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}