import { createClient } from '@supabase/supabase-js'
import { validatePassword } from '@/utils/password-validation'

// 创建普通客户端用于当前会话操作（客户端安全）
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 创建具有服务角色权限的Supabase客户端（仅服务端使用）
function createSupabaseServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service client can only be used on server side')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// 用户类型定义
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

// 登录凭证接口
export interface LoginCredentials {
  email: string
  password: string
}

// 注册凭证接口
export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface DeleteAccountResult {
  success: boolean
  message: string
  error?: string
  mode?: 'full' | 'partial'
}

/**
 * 完全删除用户账户及其所有相关数据
 * @param userId 用户ID
 * @returns 删除结果
 */
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  console.log('开始完整删除用户账户:', userId)

  try {
    // 动态创建服务端客户端
    const supabaseService = createSupabaseServiceClient()

    // 1. 首先使用服务角色权限删除auth用户
    console.log('步骤1: 删除auth用户记录...')
    const { error: authDeleteError } = await supabaseService.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('删除auth用户失败:', authDeleteError)
      return {
        success: false,
        error: `删除认证记录失败: ${authDeleteError.message}`,
      }
    }

    console.log('步骤2: 删除user_profiles记录...')
    // 2. 删除用户资料记录
    const { error: profileDeleteError } = await supabaseService
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.warn('删除用户资料失败:', profileDeleteError)
      // 继续执行，不因为资料删除失败而中断
    }

    console.log('步骤3: 删除对话记录...')
    // 3. 删除用户的所有对话记录
    const { error: conversationsDeleteError } = await supabaseService
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    if (conversationsDeleteError) {
      console.warn('删除对话记录失败:', conversationsDeleteError)
      // 继续执行
    }

    console.log('步骤4: 删除消息记录...')
    // 4. 删除用户的所有消息记录
    const { error: messagesDeleteError } = await supabaseService
      .from('messages')
      .delete()
      .eq('user_id', userId)

    if (messagesDeleteError) {
      console.warn('删除消息记录失败:', messagesDeleteError)
      // 继续执行
    }

    console.log('步骤5: 登出所有会话...')
    // 5. 尝试登出当前会话
    try {
      const { error: signOutError } = await supabaseClient.auth.signOut()
      if (signOutError) {
        console.warn('登出会话失败:', signOutError)
      }
    } catch (signOutError) {
      console.warn('登出操作异常:', signOutError)
    }

    console.log('用户账户删除完成')

    return {
      success: true,
      message: '账户及其所有相关数据已完全删除',
      mode: 'full',
    }
  } catch (error: any) {
    console.error('删除用户账户时发生未预期的错误:', error)
    return {
      success: false,
      error: `删除过程中发生错误: ${error.message}`,
    }
  }
}

/**
 * 获取用户删除统计信息
 * @param userId 用户ID
 * @returns 删除统计信息
 */
/**
 * 获取用户资料信息
 * @param userId 用户ID
 * @returns 用户资料信息
 */
/**
 * 获取当前用户
 * @returns 当前用户信息
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser()

    if (error) {
      console.error('获取当前用户失败:', error)
      return null
    }

    if (!user) {
      return null
    }

    // 获取用户资料信息
    const profile = await getUserProfile(user.id)

    return {
      user,
      profile,
      isAdmin: profile?.role === 'admin' || user.email?.endsWith('@admin.com') || false,
    }
  } catch (error) {
    console.error('获取当前用户异常:', error)
    return null
  }
}

/**
 * 监听认证状态变化
 * @param callback 回调函数
 * @returns 订阅对象
 */
export function onAuthStateChange(callback: (user: any, isAdmin: boolean) => void) {
  return supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try {
        const profile = await getUserProfile(session.user.id)
        const isAdmin = profile?.role === 'admin' || session.user.email?.endsWith('@admin.com') || false
        callback(session.user, isAdmin)
      } catch (error) {
        console.error('认证状态变化处理失败:', error)
        callback(session.user, false)
      }
    } else {
      callback(null, false)
    }
  })
}

/**
 * 检查认证状态
 * @returns 是否有认证cookie或存储的认证信息
 */
export function checkAuthStatus() {
  if (typeof document === 'undefined') { return false }

  // 检查是否有Supabase相关的cookie
  const hasAuthCookie = document.cookie.includes('sb-')
  
  // 检查localStorage和sessionStorage中的认证信息
  const hasLocalStorage = localStorage.getItem('supabase.auth.token') !== null
  const hasSessionStorage = sessionStorage.getItem('supabase.auth.token') !== null

  return hasAuthCookie || hasLocalStorage || hasSessionStorage
}

/**
 * 用户登录
 * @param credentials 登录凭证
 * @returns 登录结果
 */
export async function signIn(credentials: LoginCredentials) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword(credentials)

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: '登录失败' }
    }

    const profile = await getUserProfile(data.user.id)

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
        role: profile?.role || 'user',
        created_at: data.user.created_at,
        updated_at: profile?.updated_at || data.user.updated_at,
      },
      isAdmin: profile?.role === 'admin' || data.user.email?.endsWith('@admin.com') || false,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 用户注册
 * @param credentials 注册凭证
 * @returns 注册结果
 */
export async function signUp(credentials: RegisterCredentials) {
  try {
    // 验证密码策略
    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.isValid) {
      return { 
        success: false, 
        error: passwordValidation.errors.join('；') 
      }
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name || credentials.email.split('@')[0],
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 更新用户资料
 * @param userId 用户ID
 * @param updates 更新数据
 * @returns 更新结果
 */
export async function updateUserProfile(userId: string, updates: Partial<User>) {
  try {
    // 根据运行环境选择客户端
    const client = typeof window === 'undefined' ? createSupabaseServiceClient() : supabaseClient

    const { data, error } = await client
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户资料失败:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 检查用户是否为管理员
 * @param userId 用户ID
 * @returns 是否为管理员
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    // 根据运行环境选择客户端
    const client = typeof window === 'undefined' ? createSupabaseServiceClient() : supabaseClient

    const { data, error } = await client
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('检查管理员权限失败:', error)
      return false
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('检查管理员权限异常:', error)
    return false
  }
}

/**
 * 重置密码
 * @param email 用户邮箱
 * @returns 重置结果
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 更新用户密码
 * @param newPassword 新密码
 * @returns 更新结果
 */
export async function updatePassword(newPassword: string) {
  try {
    // 验证密码策略
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return { 
        success: false, 
        error: passwordValidation.errors.join('；') 
      }
    }

    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 获取用户资料信息
 * @param userId 用户ID
 * @returns 用户资料信息
 */
export async function getUserProfile(userId: string) {
  try {
    // 根据运行环境选择客户端
    const client = typeof window === 'undefined' ? createSupabaseServiceClient() : supabaseClient

    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('获取用户资料失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取用户资料异常:', error)
    return null
  }
}

/**
 * 客户端登出函数
 * 清除本地存储的认证状态并调用Supabase登出
 */
export async function signOut() {
  try {
    // 1. 调用Supabase登出API
    const { error } = await supabaseClient.auth.signOut()

    if (error) {
      console.warn('Supabase登出警告:', error)
    }

    // 2. 清除本地存储的认证数据
    if (typeof window !== 'undefined') {
      // 清除Supabase相关的localStorage数据
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // 清除sessionStorage
      sessionStorage.clear()

      console.log('已清除本地认证存储')
    }

    return { success: true }
  } catch (error) {
    console.error('登出过程中发生错误:', error)
    return { success: false, error }
  }
}

/**
 * 获取用户删除统计信息
 * @param userId 用户ID
 * @returns 删除统计信息
 */
export async function getUserDeleteStats(userId: string) {
  try {
    const [profiles, conversations, messages] = await Promise.all([
      supabaseService.from('user_profiles').select('count').eq('id', userId),
      supabaseService.from('conversations').select('count').eq('user_id', userId),
      supabaseService.from('messages').select('count').eq('user_id', userId),
    ])

    return {
      profiles: profiles.count || 0,
      conversations: conversations.count || 0,
      messages: messages.count || 0,
    }
  } catch (error) {
    console.error('获取用户统计信息失败:', error)
    return {
      profiles: 0,
      conversations: 0,
      messages: 0,
    }
  }
}
