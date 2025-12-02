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

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('user_profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    // 添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 添加角色过滤
    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, error, count } = await query

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_login_at,
        email_confirmed_at: null,
        last_login_at: user.last_login_at,
      })) || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// PUT - 更新用户角色
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { userId, role, name } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '无效的用户角色' }, { status: 400 })
    }

    // 更新用户资料
    const updateData: any = {}
    if (role) updateData.role = role
    if (name) updateData.name = name
    updateData.updated_at = new Date().toISOString()

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户失败:', error)
      return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: profile
    })

  } catch (error) {
    console.error('更新用户错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
    }

    // 防止删除自己
    if (userId === admin.id) {
      return NextResponse.json({ error: '不能删除自己的账户' }, { status: 400 })
    }

    // 首先删除用户的资料
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('删除用户资料失败:', profileError)
      return NextResponse.json({ error: '删除用户资料失败' }, { status: 500 })
    }

    // 删除用户的相关数据
    await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)

    // 注意：由于没有service role key，我们只能删除用户资料
    // 真正的用户认证删除需要service role权限或在Supabase控制台手动操作
    console.log('用户资料删除完成，请手动在Supabase控制台删除用户认证记录:', userId)

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    })

  } catch (error) {
    console.error('删除用户错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}