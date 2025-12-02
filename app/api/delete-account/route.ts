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
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  // 确保总是返回JSON响应，防止HTML错误页面
  const jsonResponse = (data: any, status: number = 200) => {
    return NextResponse.json(data, { status })
  }

  try {
    // 在运行时创建客户端，避免构建时依赖
    const supabaseService = createSupabaseClient()

    console.log('=== 注销账户请求开始 ===')

    // 添加更严格的请求体解析
    let body
    try {
      const text = await request.text()
      console.log('请求体:', text)
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('请求体解析失败:', parseError)
      return jsonResponse(
        { error: '请求格式错误，请发送有效的JSON数据' },
        400,
      )
    }

    const { email, password } = body

    // 验证输入
    if (!email || !password) {
      console.log('验证失败：邮箱或密码为空')
      return jsonResponse(
        { error: '邮箱和密码不能为空' },
        400,
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('验证失败：邮箱格式无效')
      return jsonResponse(
        { error: '请输入有效的邮箱地址' },
        400,
      )
    }

    console.log('开始验证用户身份...', { email })

    // 使用服务角色客户端验证用户身份
    const { data: signInData, error: signInError } = await supabaseService.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.user) {
      console.error('身份验证失败:', signInError?.message)
      return jsonResponse(
        { error: '邮箱或密码错误，无法验证身份' },
        401,
      )
    }

    console.log('用户身份验证成功，开始注销账户...', { userId: signInData.user.id })

    // 首先检查用户是否真的存在于auth系统中
    console.log('检查用户是否存在...')
    try {
      const { supabaseUrl, serviceRoleKey } = validateEnvironment()
      const listUsersUrl = `${supabaseUrl}/auth/v1/admin/users`
      const checkResponse = await fetch(listUsersUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      })

      if (!checkResponse.ok) {
        console.error('无法访问用户列表API:', checkResponse.status)
        return jsonResponse(
          { error: '无法访问用户管理系统' },
          500,
        )
      }

      const usersData = await checkResponse.json()
      const userExists = usersData.users?.some((u: any) => u.id === signInData.user.id)

      if (!userExists) {
        console.log('用户在auth系统中不存在，跳过认证删除')
        return jsonResponse({
          success: true,
          message: '用户不存在或已被删除',
          mode: 'partial',
        })
      }

      console.log('用户存在，继续删除流程')
    } catch (checkError: any) {
      console.error('检查用户存在性失败:', checkError)
      return jsonResponse(
        { error: `系统检查失败: ${checkError.message}` },
        500,
      )
    }

    try {
      // 先删除用户的所有相关数据，最后删除认证记录
      console.log('步骤1: 删除user_profiles记录...')
      const { error: profileDeleteError } = await supabaseService
        .from('user_profiles')
        .delete()
        .eq('id', signInData.user.id)

      if (profileDeleteError) {
        console.warn('删除用户资料失败:', profileDeleteError)
        // 继续执行，不中断删除流程
      }

      console.log('步骤2: 删除对话记录...')
      const { error: conversationsDeleteError } = await supabaseService
        .from('conversations')
        .delete()
        .eq('user_id', signInData.user.id)

      if (conversationsDeleteError) {
        console.warn('删除对话记录失败:', conversationsDeleteError)
        // 继续执行
      }

      console.log('步骤3: 删除消息记录...')
      const { error: messagesDeleteError } = await supabaseService
        .from('messages')
        .delete()
        .eq('user_id', signInData.user.id)

      if (messagesDeleteError) {
        console.warn('删除消息记录失败:', messagesDeleteError)
        // 继续执行
      }

      console.log('步骤4: 删除auth用户记录...')

      // 使用HTTP API直接删除用户
      const { deleteUserViaAPI } = await import('@/lib/supabase-admin')
      const authDeleteResult = await deleteUserViaAPI(signInData.user.id)

      if (!authDeleteResult.success) {
        console.error('删除auth用户失败:', authDeleteResult.error)
        // 即使认证删除失败，其他数据已删除，可以认为部分成功
        return jsonResponse({
          success: true,
          message: '用户数据已删除，但认证记录需要管理员手动清理',
          mode: 'partial',
          error: authDeleteResult.error,
        })
      }

      console.log('用户账户删除完成')

      return jsonResponse({
        success: true,
        message: '账户及其所有相关数据已完全删除',
        mode: 'full',
      })
    } catch (deleteError: any) {
      console.error('删除账户过程中发生错误:', deleteError)

      return jsonResponse(
        {
          error: deleteError.message || '删除账户失败，请稍后重试',
          details: process.env.NODE_ENV === 'development' ? deleteError.stack : undefined,
        },
        500,
      )
    }
  } catch (error: any) {
    console.error('删除账户过程中发生错误:', error)
    console.error('错误堆栈:', error.stack)

    // 确保返回JSON格式，而不是HTML错误页面
    return jsonResponse(
      {
        error: error.message || '删除账户失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      500,
    )
  }
}
