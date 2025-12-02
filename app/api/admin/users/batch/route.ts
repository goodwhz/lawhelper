import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkIsAdmin } from '@/lib/auth'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      return null
    }

    if (!checkIsAdmin(user.email || '')) {
      return null
    }

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
        // 批量删除用户数据
        await supabase
          .from('conversations')
          .delete()
          .in('user_id', userIds)

        await supabase
          .from('messages')
          .delete()
          .in('user_id', userIds)

        // 删除用户资料
        const { error: deleteProfileError } = await supabase
          .from('user_profiles')
          .delete()
          .in('id', userIds)

        if (deleteProfileError) {
          console.error('批量删除用户资料失败:', deleteProfileError)
          return NextResponse.json({ error: '批量删除失败' }, { status: 500 })
        }

        // 注意：由于没有service role key，我们只能删除用户资料
        // 真正的用户认证删除需要service role权限或在Supabase控制台手动操作
        console.log('用户资料批量删除完成，请手动在Supabase控制台删除用户认证记录:', userIds)

        result = {
          success: true,
          message: `成功删除 ${userIds.length} 个用户的资料记录，请手动删除认证记录`,
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