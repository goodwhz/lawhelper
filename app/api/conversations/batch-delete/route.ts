import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// POST - 批量删除对话
export async function POST(request: NextRequest) {
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
        // 不要立即返回失败，继续尝试方法2
      }
    }
    
    // 方法2: X-User-ID Header (备用认证方式)
    if (!user) {
      const xUserId = request.headers.get('x-user-id')
      const xUserEmail = request.headers.get('x-user-email')
      
      if (xUserId) {
        // 直接使用X-User-ID，邮箱可选用于日志
        user = { id: xUserId, email: xUserEmail || '' }
        userId = xUserId
        console.log('X-User-ID认证成功:', userId)
      }
    }
    
    // 如果两种认证方式都失败
    if (!user || !userId) {
      console.log('所有认证方式都失败')
      console.log('Headers received:', {
        authorization: request.headers.get('authorization'),
        'x-user-id': request.headers.get('x-user-id'),
        'x-user-email': request.headers.get('x-user-email')
      })
      const errorData = { error: '用户未认证' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { conversation_ids } = body

    if (!conversation_ids || !Array.isArray(conversation_ids)) {
      const errorData = { error: '请提供有效的对话ID列表' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (conversation_ids.length === 0) {
      const errorData = { error: '对话ID列表不能为空' }
      return new NextResponse(JSON.stringify(errorData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('=== 批量删除对话 ===')
    console.log('User ID:', user.id)
    console.log('Conversation IDs:', conversation_ids)

    // 直接使用逐个删除方法（更可靠）
    console.log('开始批量删除对话，用户ID:', userId)
    console.log('要删除的对话ID:', conversation_ids)
    
    let deletedCount = 0
    const failedIds = []
    
    for (const convId of conversation_ids) {
      try {
        console.log(`尝试删除对话: ${convId}`)
        
        // 先验证对话所有权
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, title')
          .eq('id', convId)
          .eq('user_id', userId)
          .single()
        
        if (convError) {
          console.error(`验证对话所有权失败 ${convId}:`, convError)
          failedIds.push(convId)
          continue
        }
        
        if (!convData) {
          console.log(`对话不存在或无权限: ${convId}`)
          failedIds.push(convId)
          continue
        }
        
        console.log(`对话验证成功，开始删除: ${convData.title || '无标题'}`)
        
        // 删除对话（通过数据库级联删除消息）
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', convId)
          .eq('user_id', userId)
        
        if (deleteError) {
          console.error(`删除对话失败 ${convId}:`, deleteError)
          failedIds.push(convId)
        } else {
          console.log(`对话删除成功: ${convId}`)
          deletedCount++
        }
      } catch (error) {
        console.error(`删除对话 ${convId} 异常:`, error)
        failedIds.push(convId)
      }
    }
    
    console.log(`批量删除完成: 成功 ${deletedCount}，失败 ${failedIds.length}`)
    
    const responseData = {
      success: true,
      message: deletedCount > 0 ? '删除成功' : '删除失败',
      deleted_count: deletedCount,
      failed_ids: failedIds
    }

    console.log('批量删除对话结果:', responseData)
    
    // 确保返回有效的JSON
    return new NextResponse(JSON.stringify(responseData), {
      status: deletedCount > 0 ? 200 : 400,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Batch delete conversations API error:', error)
    const errorData = { error: error instanceof Error ? error.message : '批量删除对话失败' }
    return new NextResponse(JSON.stringify(errorData), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}