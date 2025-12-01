import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET - 获取单个对话详情
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 验证用户认证 - 支持多种认证方式
    let user = null
    let userId = null
    
    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
      
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
        const { data: profileData, error: profileError } = await supabase
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
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { conversationId } = params

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)  // 添加用户验证
      .single()

    if (error) {
      console.error('获取对话详情失败:', error)
      const errorData = { error: '对话不存在或无权访问' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Conversation detail API error:', error)
    const errorData = { error: '获取对话详情失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE - 删除对话 (使用数据库函数绕过RLS)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 验证用户认证 - 支持多种认证方式
    let user = null
    let userId = null
    
    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
      
      if (!authError && authUser) {
        user = authUser
        userId = authUser.id
        console.log('Bearer token认证成功:', userId)
      } else {
        console.error('Bearer token认证失败:', authError)
      }
    }
    
    // 方法2: X-User-ID Header (备用认证方式)
    if (!user) {
      const xUserId = request.headers.get('x-user-id')
      const xUserEmail = request.headers.get('x-user-email')
      
      if (xUserId && xUserEmail) {
        // 验证用户ID和邮箱是否匹配数据库记录
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', xUserId)
          .eq('email', xUserEmail)
          .single()
        
        if (!profileError && profileData) {
          user = { id: xUserId, email: xUserEmail }
          userId = xUserId
          console.log('X-User-ID认证成功:', userId)
        } else {
          console.error('X-User-ID认证失败:', profileError)
        }
      }
    }
    
    // 如果两种认证方式都失败
    if (!user || !userId) {
      const errorData = { error: '用户未认证' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { conversationId } = params

    console.log('=== 删除对话 ===')
    console.log('User ID:', user.id)
    console.log('Conversation ID:', conversationId)

    // 先尝试使用数据库函数，如果失败则使用直接删除
    let data, error
    
    try {
      console.log('尝试使用数据库函数删除对话...')
      const rpcResult = await supabase
        .rpc('delete_conversation_with_messages', {
          conversation_uuid: conversationId
        })
      
      if (!rpcResult.error) {
        console.log('数据库函数删除成功:', rpcResult.data)
        data = rpcResult.data
        error = null
      } else {
        console.log('数据库函数不可用，使用直接删除方法:', rpcResult.error.message)
        throw rpcResult.error
      }
    } catch (funcError) {
      console.log('使用直接删除方法...')
      
      // 直接删除消息（先删除消息再删除对话）
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
      
      if (messagesError) {
        console.error('删除消息失败:', messagesError)
        error = messagesError
      } else {
        // 删除对话
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', userId)
        
        if (conversationError) {
          console.error('删除对话失败:', conversationError)
          error = conversationError
        } else {
          console.log('直接删除成功')
          data = {
            success: true,
            message: '对话删除成功',
            deleted_messages: messagesData?.length || 0
          }
        }
      }
    }

    if (error) {
      console.error('删除对话失败:', error)
      const errorData = { error: error.message || '删除对话失败' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('对话删除成功:', data)
    const responseData = {
      success: true,
      message: data?.message || '对话删除成功',
      deleted_messages: data?.deleted_messages || 0
    }
    
    // 确保返回有效的JSON
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Delete conversation API error:', error)
    const errorData = { error: error instanceof Error ? error.message : '删除对话失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT - 更新对话信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 验证用户认证 - 支持多种认证方式
    let user = null
    let userId = null
    
    // 方法1: Authorization Bearer Token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
      
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
        const { data: profileData, error: profileError } = await supabase
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
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { conversationId } = params
    const body = await request.json()
    
    console.log('=== 更新对话标题 ===')
    console.log('User ID:', user.id)
    console.log('Conversation ID:', conversationId)
    console.log('Update data:', body)

    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', userId)  // 确保只能更新自己的对话
      .select()
      .single()

    if (error) {
      console.error('更新对话失败:', error)
      const errorData = { error: '更新对话失败或无权访问' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('对话更新成功:', data)
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Update conversation API error:', error)
    const errorData = { error: error instanceof Error ? error.message : '更新对话失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}