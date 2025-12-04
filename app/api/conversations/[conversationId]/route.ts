import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 验证环境变量的辅助函数
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not properly configured')
  }

  return { supabaseUrl, serviceRoleKey }
}

// 创建具有服务角色权限的Supabase客户端（API路由中需要）
function createSupabaseClient() {
  const { supabaseUrl, serviceRoleKey } = validateEnvironment()
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - 获取单个对话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    // 在Next.js 15+中，params是异步的
    const { conversationId } = await params
    console.log('API GET - 接收到的参数:', { conversationId })

    // 验证用户认证 - 支持多种认证方式
    let user = null
    let userId = null

    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const supabaseAdmin = createSupabaseClient()
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (!authError && authUser) {
        user = authUser
        userId = authUser.id
        console.log('GET Bearer token认证成功:', userId)
      } else {
        console.error('GET Bearer token认证失败:', authError)
      }
    }

    // 方法2: X-User-ID Header (备用认证方式)
    if (!user) {
      const xUserId = request.headers.get('x-user-id')
      const xUserEmail = request.headers.get('x-user-email')

      if (xUserId && xUserEmail) {
        // 验证用户ID和邮箱是否匹配数据库记录
        const supabaseAdmin = createSupabaseClient()
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', xUserId)
          .eq('email', xUserEmail)
          .single()

        if (!profileError && profileData) {
          user = { id: xUserId, email: xUserEmail }
          userId = xUserId
          console.log('GET X-User-ID认证成功:', userId)
        } else {
          console.error('GET X-User-ID认证失败:', profileError)
        }
      }
    }

    // 如果两种认证方式都失败
    if (!user || !userId) {
      const errorData = { error: '用户未认证' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createSupabaseClient()
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId) // 添加用户验证
      .single()

    if (error) {
      console.error('获取对话详情失败:', error)
      const errorData = { error: '对话不存在或无权访问' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Conversation detail API error:', error)
    const errorData = { error: '获取对话详情失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE - 删除单个对话 (优化版本)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    // 验证用户认证
    const user = await authenticateUser(request)
    if (!user.success) {
      return NextResponse.json(
        { error: user.error || '用户未认证' },
        { status: 401 },
      )
    }

    // 在Next.js 15+中，params是异步的
    const { conversationId } = await params
    const userId = user.data!.id
    const supabaseAdmin = createSupabaseClient()

    console.log('API DELETE - 接收到的参数:', { conversationId, userId })
    console.log('API DELETE - conversationId类型:', typeof conversationId)

    // 验证 conversationId 参数
    if (!conversationId
      || typeof conversationId !== 'string'
      || conversationId === 'undefined'
      || conversationId === 'null'
      || conversationId.trim() === '') {
      console.error('无效的对话ID:', conversationId, '类型:', typeof conversationId)
      return NextResponse.json(
        { error: '无效的对话ID', code: 'INVALID_CONVERSATION_ID' },
        { status: 400 },
      )
    }

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(conversationId)) {
      console.error('对话ID格式无效:', conversationId)
      return NextResponse.json(
        { error: '对话ID格式无效', code: 'INVALID_CONVERSATION_ID' },
        { status: 400 },
      )
    }

    console.log('=== 删除单个对话 ===')
    console.log('User ID:', userId)
    console.log('Conversation ID:', conversationId)

    // 首先验证对话是否存在
    const { data: conversation, error: checkError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, user_id')
      .eq('id', conversationId)
      .single()

    if (checkError) {
      console.log('对话查询失败:', checkError)

      // 判断具体错误类型
      if (checkError.code === 'PGRST116') {
        // PGRST116 表示没有找到记录
        console.log('对话不存在:', conversationId)
        return NextResponse.json(
          { error: '对话不存在', code: 'CONVERSATION_NOT_FOUND' },
          { status: 404 },
        )
      } else {
        // 其他数据库错误
        console.log('数据库查询错误:', checkError)
        return NextResponse.json(
          { error: '查询对话失败', code: 'DATABASE_ERROR', details: checkError.message },
          { status: 500 },
        )
      }
    }

    // 检查对话是否属于当前用户
    if (!conversation || conversation.user_id !== userId) {
      console.log('无权删除对话 - 对话ID:', conversationId, '对话所有者:', conversation?.user_id, '当前用户:', userId)
      return NextResponse.json(
        { error: '无权删除此对话', code: 'PERMISSION_DENIED' },
        { status: 403 },
      )
    }

    console.log('找到要删除的对话:', conversation.title)

    // 执行删除操作 - 先删除消息再删除对话
    let deletedMessagesCount = 0
    let deleteError = null

    try {
      // 1. 删除该对话的所有消息
      console.log('步骤1: 删除对话消息...')
      const { data: deletedMessages, error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .select('id') // 获取被删除的消息数量

      if (messagesError) {
        console.error('删除消息失败:', messagesError)
        throw new Error(`删除消息失败: ${messagesError.message}`)
      }

      deletedMessagesCount = deletedMessages?.length || 0
      console.log(`成功删除 ${deletedMessagesCount} 条消息`)

      // 2. 删除对话记录
      console.log('步骤2: 删除对话记录...')
      const { error: conversationDeleteError } = await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (conversationDeleteError) {
        console.error('删除对话失败:', conversationDeleteError)
        throw new Error(`删除对话失败: ${conversationDeleteError.message}`)
      }

      console.log('对话删除成功')
    } catch (error) {
      deleteError = error
      console.error('删除操作失败:', error)
    }

    // 返回删除结果
    const responseData = {
      success: !deleteError,
      message: deleteError ? deleteError.message : '对话删除成功',
      deleted_messages: deletedMessagesCount,
      conversation,
    }

    const statusCode = deleteError ? 500 : 200
    return NextResponse.json(responseData, { status: statusCode })
  } catch (error) {
    console.error('Delete conversation API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '删除对话失败',
        success: false,
      },
      { status: 500 },
    )
  }
}

// 用户认证辅助函数
async function authenticateUser(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseClient()
    let user = null
    let userId = null

    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (!authError && authUser) {
        user = authUser
        userId = authUser.id
        console.log('Bearer token认证成功:', userId)
        return {
          success: true,
          data: user,
          error: null,
        }
      } else {
        console.warn('Bearer token认证失败:', authError?.message)
      }
    }

    // 方法2: X-User-ID Header (备用认证方式)
    const xUserId = request.headers.get('x-user-id')
    const xUserEmail = request.headers.get('x-user-email')

    if (xUserId && xUserEmail) {
      console.log('尝试使用用户ID认证:', xUserId, xUserEmail)

      // 首先验证用户是否在auth.users中存在
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(xUserId)

      if (!authError && authUser.user) {
        // 验证邮箱是否匹配
        if (authUser.user.email === xUserEmail) {
          user = authUser.user
          userId = xUserId
          console.log('X-User-ID认证成功:', userId)
          return {
            success: true,
            data: user,
            error: null,
          }
        } else {
          console.warn('邮箱不匹配:', authUser.user.email, xUserEmail)
        }
      } else {
        console.warn('无法通过用户ID找到用户:', authError?.message)

        // 如果找不到auth用户，尝试查找user_profiles（用于兼容）
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', xUserId)
          .eq('email', xUserEmail)
          .single()

        if (!profileError && profileData) {
          user = { id: xUserId, email: xUserEmail }
          userId = xUserId
          console.log('通过user_profiles认证成功:', userId)
          return {
            success: true,
            data: user,
            error: null,
          }
        } else {
          console.warn('user_profiles认证失败:', profileError?.message)
        }
      }
    }

    return {
      success: false,
      data: null,
      error: '用户未认证或认证信息无效',
    }
  } catch (error) {
    console.error('认证过程中出错:', error)
    return {
      success: false,
      data: null,
      error: '认证过程出错',
    }
  }
}

// PUT - 更新对话信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    // 在Next.js 15+中，params是异步的
    const { conversationId } = await params
    console.log('API PUT - 接收到的参数:', { conversationId })

    // 验证用户认证 - 支持多种认证方式
    let user = null
    let userId = null

    const supabaseAdmin = createSupabaseClient()

    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (!authError && authUser) {
        user = authUser
        userId = authUser.id
        console.log('PUT Bearer token认证成功:', userId)
      } else {
        console.error('PUT Bearer token认证失败:', authError)
      }
    }

    // 方法2: X-User-ID Header (备用认证方式)
    if (!user) {
      const xUserId = request.headers.get('x-user-id')
      const xUserEmail = request.headers.get('x-user-email')

      if (xUserId && xUserEmail) {
        // 验证用户ID和邮箱是否匹配数据库记录
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', xUserId)
          .eq('email', xUserEmail)
          .single()

        if (!profileError && profileData) {
          user = { id: xUserId, email: xUserEmail }
          userId = xUserId
          console.log('PUT X-User-ID认证成功:', userId)
        } else {
          console.error('PUT X-User-ID认证失败:', profileError)
        }
      }
    }

    // 如果两种认证方式都失败
    if (!user || !userId) {
      const errorData = { error: '用户未认证' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()

    // 验证 conversationId 参数（已经在函数开头获取了）
    if (!conversationId
      || typeof conversationId !== 'string'
      || conversationId === 'undefined'
      || conversationId === 'null'
      || conversationId.trim() === '') {
      console.error('无效的对话ID:', conversationId)
      return new NextResponse(JSON.stringify({
        error: '无效的对话ID',
        code: 'INVALID_CONVERSATION_ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('=== 更新对话标题 ===')
    console.log('User ID:', user.id)
    console.log('Conversation ID:', conversationId)
    console.log('Update data:', body)

    // 首先验证对话是否存在
    const { data: existingConversation, error: checkError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, user_id')
      .eq('id', conversationId)
      .single()

    if (checkError) {
      console.log('对话查询失败:', checkError)

      // 判断具体错误类型
      if (checkError.code === 'PGRST116') {
        // PGRST116 表示没有找到记录
        console.log('对话不存在:', conversationId)
        return new NextResponse(JSON.stringify({
          error: '对话不存在',
          code: 'CONVERSATION_NOT_FOUND',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      } else {
        // 其他数据库错误
        console.log('数据库查询错误:', checkError)
        return new NextResponse(JSON.stringify({
          error: '查询对话失败',
          code: 'DATABASE_ERROR',
          details: checkError.message,
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // 检查对话是否属于当前用户
    if (!existingConversation || existingConversation.user_id !== userId) {
      console.log('无权更新对话 - 对话ID:', conversationId, '对话所有者:', existingConversation?.user_id, '当前用户:', userId)
      return new NextResponse(JSON.stringify({
        error: '无权更新此对话',
        code: 'PERMISSION_DENIED',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('找到要更新的对话:', existingConversation)

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', userId) // 确保只能更新自己的对话
      .select()
      .single()

    if (error) {
      console.error('更新对话失败:', error)
      console.error('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      const errorData = {
        error: `更新对话失败: ${error.message}`,
        code: error.code,
        details: error.details,
      }
      return new NextResponse(JSON.stringify(errorData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('对话更新成功:', data)
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Update conversation API error:', error)
    const errorData = { error: error instanceof Error ? error.message : '更新对话失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
