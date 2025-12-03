import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建具有服务角色权限的Supabase客户端
function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  console.log('=== 调试删除用户功能 ===')
  
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 })
    }

    const supabaseService = createSupabaseServiceClient()
    
    console.log(`开始检查用户: ${userId}`)
    
    // 1. 检查用户在auth.users表中是否存在
    console.log('步骤1: 检查auth.users表...')
    try {
      // 直接查询auth.users表
      const { data: authUsers, error: authCheckError } = await supabaseService
        .from('auth.users')
        .select('id, email, created_at')
        .eq('id', userId)
      
      if (authCheckError) {
        console.log('无法查询auth.users表:', authCheckError.message)
        // 尝试使用HTTP API检查
        console.log('尝试使用HTTP API检查用户...')
        
        const { supabaseUrl, serviceRoleKey } = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
        }
        
        const checkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        })
        
        if (checkResponse.ok) {
          const userData = await checkResponse.json()
          console.log('用户在Auth系统中存在:', userData)
        } else {
          console.log('用户在Auth系统中不存在:', checkResponse.status)
        }
      } else {
        console.log('Auth查询结果:', authUsers)
      }
    } catch (error: any) {
      console.log('检查Auth用户出错:', error.message)
    }
    
    // 2. 检查用户在user_profiles表中是否存在
    console.log('步骤2: 检查user_profiles表...')
    const { data: profiles, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', userId)
    
    console.log('Profiles查询结果:', profiles || profileError?.message)
    
    // 3. 检查相关的conversations和messages
    console.log('步骤3: 检查conversations表...')
    const { data: conversations, error: convError } = await supabaseService
      .from('conversations')
      .select('id, title')
      .eq('user_id', userId)
      .limit(5)
    
    console.log('Conversations查询结果:', conversations?.length || 0, '条记录', convError?.message)
    
    console.log('步骤4: 检查messages表...')
    const { data: messages, error: msgError } = await supabaseService
      .from('messages')
      .select('id, content')
      .eq('user_id', userId)
      .limit(5)
    
    console.log('Messages查询结果:', messages?.length || 0, '条记录', msgError?.message)
    
    // 4. 尝试执行删除操作
    console.log('步骤5: 尝试删除用户...')
    
    // 5.1 删除user_profiles
    const { error: deleteProfileError } = await supabaseService
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    
    console.log('删除profile结果:', deleteProfileError?.message || '成功')
    
    // 5.2 删除conversations
    const { error: deleteConvError } = await supabaseService
      .from('conversations')
      .delete()
      .eq('user_id', userId)
    
    console.log('删除conversations结果:', deleteConvError?.message || '成功')
    
    // 5.3 删除messages
    const { error: deleteMsgError } = await supabaseService
      .from('messages')
      .delete()
      .eq('user_id', userId)
    
    console.log('删除messages结果:', deleteMsgError?.message || '成功')
    
    // 5.4 删除auth用户 - 使用Admin API
    console.log('尝试删除Auth用户...')
    const { supabaseUrl, serviceRoleKey } = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    }
    
    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Auth删除响应状态:', deleteResponse.status)
    if (deleteResponse.ok) {
      console.log('Auth用户删除成功')
    } else {
      const errorText = await deleteResponse.text()
      console.log('Auth用户删除失败:', errorText)
    }
    
    // 6. 再次检查用户是否存在
    console.log('步骤6: 删除后验证...')
    
    // 延迟1秒再检查，确保删除操作完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 再次检查
    const { data: finalProfiles, error: finalProfileError } = await supabaseService
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
    
    const finalCheckResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    })
    
    console.log('最终检查 - Profile:', finalProfiles?.length || 0, '条记录')
    console.log('最终检查 - Auth:', finalCheckResponse.ok ? '仍存在' : '已删除')
    
    return NextResponse.json({
      success: true,
      message: '调试检查完成',
      results: {
        profile: (finalProfiles?.length || 0) === 0 ? '已删除' : '仍存在',
        auth: finalCheckResponse.ok ? '仍存在' : '已删除',
        authStatus: finalCheckResponse.status,
      }
    })
    
  } catch (error: any) {
    console.error('调试过程出错:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '调试删除功能的端点',
    usage: 'POST { userId: string }',
    description: '检查用户数据状态并尝试删除'
  })
}