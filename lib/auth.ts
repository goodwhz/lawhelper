import Cookies from 'js-cookie'
import { supabase } from './supabaseClient'

export interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

// 管理员邮箱列表（硬编码）
const ADMIN_EMAILS = [
  'admin@lawhelper.com',
  'super@admin.com',
]

// 检查用户是否为管理员
export const checkIsAdmin = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// 用户登录
export async function signIn(credentials: LoginCredentials) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      console.error('登录失败:', error)

      // 根据错误类型返回友好的错误信息
      if (error.message === 'Invalid login credentials') {
        return {
          success: false,
          error: '邮箱或密码错误',
        }
      } else if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: '请先验证您的邮箱',
        }
      } else {
        return {
          success: false,
          error: `登录失败: ${error.message}`,
        }
      }
    }

    if (data.user) {
      // 检查或创建用户资料
      await upsertUserProfile(data.user)

      // 设置登录状态cookie
      Cookies.set('auth_state', 'authenticated', {
        expires: 7, // 7天
        path: '/',
      })

      return {
        success: true,
        user: data.user,
        isAdmin: checkIsAdmin(data.user.email || ''),
      }
    }

    return {
      success: false,
      error: '登录失败：未知错误',
    }
  } catch (error: any) {
    console.error('signIn error:', error)
    return {
      success: false,
      error: error.message || '登录失败，请重试',
    }
  }
}

// 用户注册
export async function signUp(credentials: RegisterCredentials) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name || '',
          role: 'user',
        },
      },
    })

    if (error) {
      console.error('注册失败:', error)

      // 根据错误类型返回友好的错误信息
      if (error.message.includes('already registered')) {
        return {
          success: false,
          error: '该邮箱已被注册',
        }
      } else if (error.message.includes('weak password')) {
        return {
          success: false,
          error: '密码强度不够，请使用更复杂的密码',
        }
      } else if (error.message.includes('valid email')) {
        return {
          success: false,
          error: '请输入有效的邮箱地址',
        }
      } else {
        return {
          success: false,
          error: `注册失败: ${error.message}`,
        }
      }
    }

    if (data.user) {
      // 注册成功，立即创建用户资料（不管是否需要邮箱验证）
      try {
        await upsertUserProfile(data.user)
        console.log('用户资料创建成功')
      } catch (profileError) {
        console.error('创建用户资料失败:', profileError)
        // 不阻止注册流程，只记录错误
      }
    }

    if (data.user && !data.session) {
      // 注册成功但需要邮箱验证
      return {
        success: true,
        error: '注册成功，请查收邮件并验证邮箱',
        user: data.user,
        isAdmin: checkIsAdmin(data.user.email || ''),
      }
    }

    if (data.user && data.session) {
      // 自动登录成功
      // 设置登录状态cookie
      Cookies.set('auth_state', 'authenticated', {
        expires: 7,
        path: '/',
      })

      return {
        success: true,
        user: data.user,
        isAdmin: checkIsAdmin(data.user.email || ''),
      }
    }

    return {
      success: false,
      error: '注册失败：未知错误',
    }
  } catch (error: any) {
    console.error('signUp error:', error)
    return {
      success: false,
      error: error.message || '注册失败，请重试',
    }
  }
}

// 用户登出
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('登出失败:', error)
      throw new Error(`登出失败: ${error.message}`)
    }

    // 清除cookie
    Cookies.remove('auth_state', { path: '/' })

    return true
  } catch (error: any) {
    console.error('signOut error:', error)
    throw error
  }
}

// 获取当前用户
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('获取用户信息失败:', error)
      return null
    }

    if (user) {
      return {
        user,
        isAdmin: checkIsAdmin(user.email || ''),
      }
    }

    return null
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

// 更新用户资料（简化版本）
export async function updateUserProfile(userId: string, name: string, email: string, isAdmin: boolean = false) {
  try {
    console.log('=== 更新用户资料 ===')
    console.log('用户ID:', userId)
    console.log('姓名:', name)
    console.log('邮箱:', email)
    console.log('管理员:', isAdmin)

    const userRole = isAdmin ? 'admin' : 'user'

    // 先尝试更新现有记录
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          name,
          role: userRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('更新现有记录失败:', error)

        // 如果更新失败（可能记录不存在），尝试插入新记录
        console.log('尝试插入新记录...')
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email,
            name,
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (insertError) {
          console.error('插入新记录失败:', insertError)
          throw new Error(`更新用户资料失败: ${insertError.message}`)
        } else {
          console.log('插入新记录成功:', insertData)
        }
      } else {
        console.log('更新现有记录成功:', data)
      }
    } catch (updateError: any) {
      console.error('用户资料操作异常:', updateError)
      throw new Error(`更新用户资料失败: ${updateError.message}`)
    }

    // 同时更新用户元数据（用于备份）
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name,
        },
      })

      if (error) {
        console.warn('更新用户元数据失败:', error)
        // 不抛出错误，因为主要更新已经成功
      } else {
        console.log('更新用户元数据成功')
      }
    } catch (metaError) {
      console.warn('更新用户元数据异常:', metaError)
    }

    return { success: true }
  } catch (error) {
    console.error('updateUserProfile error:', error)
    throw error
  }
}

// 获取用户资料（简化版本）
export async function getUserProfile(userId: string) {
  try {
    console.log('=== 获取用户资料 ===')
    console.log('用户ID:', userId)

    // 直接查询 user_profiles 表
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('查询用户资料失败:', error)
        return null
      } else {
        console.log('查询用户资料成功:', data)
        return data
      }
    } catch (queryError) {
      console.error('查询用户资料异常:', queryError)
      return null
    }
  } catch (error) {
    console.error('getUserProfile error:', error)
    return null
  }
}

// 更新或创建用户资料（保持向后兼容）
async function upsertUserProfile(authUser: any) {
  try {
    if (!authUser || !authUser.id) {
      console.error('用户信息无效:', authUser)
      return
    }

    const isAdmin = checkIsAdmin(authUser.email || '')
    const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || ''

    await updateUserProfile(
      authUser.id,
      name,
      authUser.email,
      isAdmin,
    )

    // 更新最后登录时间
    await updateLastLoginTime(authUser.id)

    console.log('用户资料处理完成')
  } catch (error) {
    console.error('upsertUserProfile error:', error)
    // 不再抛出错误，避免影响登录流程
  }
}

// 检查登录状态
export function checkAuthStatus(): boolean {
  return Cookies.get('auth_state') === 'authenticated'
}

// 监听认证状态变化
export function onAuthStateChange(callback: (user: any, isAdmin: boolean) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const isAdmin = checkIsAdmin(session.user.email || '')
      callback(session.user, isAdmin)

      // 更新cookie状态
      if (event === 'SIGNED_IN') {
        Cookies.set('auth_state', 'authenticated', { expires: 7, path: '/' })

        // 登录时更新最后登录时间
        await updateLastLoginTime(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        Cookies.remove('auth_state', { path: '/' })
      }
    } else {
      callback(null, false)
      Cookies.remove('auth_state', { path: '/' })
    }
  })
}

// 重置密码
export async function resetPassword(email: string) {
  try {
    const redirectUrl = `${window.location.origin}/reset-password`
    console.log('=== 发送密码重置邮件 ===')
    console.log('邮箱:', email)
    console.log('重定向URL:', redirectUrl)

    // 使用最简单的配置发送重置邮件
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('重置密码失败:', error)
      console.error('错误详情:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details,
      })

      // 根据错误类型提供更具体的错误信息
      if (error.message.includes('User not found')) {
        throw new Error('该邮箱未注册，请先注册账号')
      } else if (error.message.includes('rate limit')) {
        throw new Error('发送过于频繁，请稍后再试')
      } else {
        throw new Error(`重置密码失败: ${error.message}`)
      }
    }

    console.log('重置密码邮件发送成功:', data)
    return true
  } catch (error: any) {
    console.error('resetPassword error:', error)
    throw error
  }
}

// 更新密码
export async function updatePassword(newPassword: string, accessToken?: string, refreshToken?: string) {
  try {
    // 如果提供了访问令牌，则使用它来设置会话
    if (accessToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      })

      if (sessionError) {
        console.error('设置会话失败:', sessionError)
        return {
          success: false,
          error: '密码重置链接已过期或无效',
        }
      }
    }

    // 更新用户密码
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('更新密码失败:', error)
      return {
        success: false,
        error: `更新密码失败: ${error.message}`,
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('updatePassword error:', error)
    return {
      success: false,
      error: error.message || '更新密码失败，请重试',
    }
  }
}

// 更新用户最后登录时间
export async function updateLastLoginTime(userId: string) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('更新最后登录时间失败:', error)
    } else {
      console.log('最后登录时间更新成功')
    }
  } catch (error) {
    console.error('updateLastLoginTime error:', error)
  }
}

// 检查用户是否为管理员（异步版本，用于API路由）
export async function isAdmin(user: any): Promise<boolean> {
  if (!user || !user.email) {
    return false
  }
  return checkIsAdmin(user.email)
}
