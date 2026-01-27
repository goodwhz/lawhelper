import { supabase } from './supabaseClient'

// 类型定义
export type SafeUserResult
  = | { user: any, error: null }
    | { user: null, error: string }

export type SafeSessionResult
  = | { session: any, error: null }
    | { session: null, error: string }

/**
 * 检查是否在浏览器环境
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

/**
 * 从本地存储获取缓存数据
 */
function getCacheData() {
  if (!isBrowser) {
    return null
  }

  try {
    const sessionData = window.localStorage.getItem('supabase.auth.token')
    if (sessionData) {
      return JSON.parse(sessionData)
    }
  } catch (e) {
    console.error('解析缓存数据失败:', e)
  }
  return null
}

/**
 * 安全地获取当前用户信息
 * 使用更简单的方法：先尝试从缓存获取，缓存失败再调用 API
 */
export async function safeGetUser(): Promise<SafeUserResult> {
  try {
    // 1. 先尝试从缓存获取（快速）
    const cached = getCacheData()
    if (cached?.currentSession?.user) {
      console.log('✓ 从缓存获取用户成功')
      return { user: cached.currentSession.user, error: null }
    }

    // 2. 缓存未命中，调用 API（带超时）
    console.log('缓存未命中，调用 API 获取用户...')
    const timeoutPromise = new Promise<{ user: null, error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ user: null, error: 'timeout' })
      }, 3000) // 减少到3秒超时
    })

    const userPromise = supabase.auth.getUser()

    const result = await Promise.race([userPromise, timeoutPromise])

    if (result.error === 'timeout') {
      console.warn('getUser 超时')
      return { user: null, error: '获取用户信息超时' }
    }

    if (result.error) {
      console.error('getUser 错误:', result.error)
      return { user: null, error: String(result.error) }
    }

    console.log('✓ 从 API 获取用户成功')
    return { user: result.data.user, error: null }
  } catch (error: any) {
    console.error('获取用户信息异常:', error)
    return { user: null, error: String(error) }
  }
}

/**
 * 安全地获取当前 session
 */
export async function safeGetSession(): Promise<SafeSessionResult> {
  try {
    // 1. 先尝试从缓存获取（快速）
    const cached = getCacheData()
    if (cached?.currentSession?.access_token) {
      console.log('✓ 从缓存获取 session 成功')
      return {
        session: cached.currentSession,
        error: null,
      }
    }

    // 2. 缓存未命中，调用 API（带超时）
    console.log('缓存未命中，调用 API 获取 session...')
    const timeoutPromise = new Promise<{ session: null, error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ session: null, error: 'timeout' })
      }, 3000) // 减少到3秒超时
    })

    const sessionPromise = supabase.auth.getSession()

    const result = await Promise.race([sessionPromise, timeoutPromise])

    if (result.error === 'timeout') {
      console.warn('getSession 超时')
      return { session: null, error: '获取 session 超时' }
    }

    if (result.error) {
      console.error('getSession 错误:', result.error)
      return { session: null, error: String(result.error) }
    }

    console.log('✓ 从 API 获取 session 成功')
    return { session: result.data.session, error: null }
  } catch (error: any) {
    console.error('获取 session 异常:', error)
    return { session: null, error: String(error) }
  }
}

/**
 * 带重试的获取用户信息
 */
export async function getUserWithRetry(maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await safeGetUser()
    if (result.user && !result.error) {
      return result
    }

    if (i < maxRetries - 1) {
      console.log(`第 ${i + 1} 次重试获取用户信息...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  return { user: null, error: '重试失败' }
}

/**
 * 带重试的获取session
 */
export async function getSessionWithRetry(maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await safeGetSession()
    if (result.session && !result.error) {
      return result
    }

    if (i < maxRetries - 1) {
      console.log(`第 ${i + 1} 次重试获取 session...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  return { session: null, error: '重试失败' }
}

/**
 * 检查用户是否已登录
 */
export async function isUserLoggedIn(): Promise<boolean> {
  const { user, error } = await safeGetUser()
  if (error) {
    console.error('检查登录状态失败:', error)
  }
  return !!user
}

/**
 * 获取认证token用于API调用
 */
export async function getAuthToken(): Promise<string | null> {
  const { session } = await safeGetSession()
  return session?.access_token || null
}
