'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/lib/auth'
import { getCurrentUser, onAuthStateChange, checkAuthStatus } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
  loginRequired: boolean
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
  checkAndRequireAuth: () => boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 计算属性
  const isAuthenticated = !!user
  const loginRequired = showLoginModal && !isAuthenticated

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      // 检查缓存中的用户信息
      if (typeof window !== 'undefined') {
        try {
          const cachedUser = sessionStorage.getItem('userCache')
          if (cachedUser) {
            const { user, isAdmin, timestamp } = JSON.parse(cachedUser)
            // 缓存有效期 2 分钟
            if (Date.now() - timestamp < 2 * 60 * 1000) {
              setUser(user)
              setIsAdmin(isAdmin)
              setIsLoading(false)
              return
            }
          }
        } catch (cacheError) {
          console.warn('读取用户缓存失败:', cacheError)
        }
      }

      const result = await getCurrentUser()
      if (result) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: result.profile?.name || result.user.user_metadata?.name || result.user.email?.split('@')[0] || '',
          role: result.profile?.role || (result.isAdmin ? 'admin' : 'user'),
          created_at: result.user.created_at,
          updated_at: result.profile?.updated_at || result.user.updated_at,
        }

        setUser(userData)
        setIsAdmin(result.isAdmin)

        // 更新缓存
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('userCache', JSON.stringify({
              user: userData,
              isAdmin: result.isAdmin,
              timestamp: Date.now()
            }))
          } catch (cacheError) {
            console.warn('缓存用户信息失败:', cacheError)
          }
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        // 清除缓存
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('userCache')
        }
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      setUser(null)
      setIsAdmin(false)
      // 清除可能损坏的缓存
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('userCache')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 检查是否需要登录
  const checkAndRequireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      setShowLoginModal(true)
      return false
    }
    return true
  }

  // 登出方法
  const signOut = async () => {
    try {
      // 调用auth模块的signOut函数
      const { signOut: authSignOut } = await import('@/lib/auth')
      await authSignOut()

      // 清除本地状态
      setUser(null)
      setIsAdmin(false)
      setShowLoginModal(false)

      console.log('AuthContext状态已清除')
    } catch (error) {
      console.error('AuthContext登出失败:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // 快速初始化认证状态
    const initAuth = async () => {
      try {
        // 优先检查本地缓存
        if (typeof window !== 'undefined') {
          try {
            const cachedUser = sessionStorage.getItem('userCache')
            if (cachedUser) {
              const { user, isAdmin, timestamp } = JSON.parse(cachedUser)
              // 缓存有效期 2 分钟
              if (Date.now() - timestamp < 2 * 60 * 1000) {
                setUser(user)
                setIsAdmin(isAdmin)
                setIsLoading(false)
                
                // 异步验证认证状态，不阻塞界面
                verifyAuthState()
                return
              }
            }
          } catch (cacheError) {
            console.warn('读取用户缓存失败:', cacheError)
          }
        }

        // 检查认证状态
        const hasAuthCookie = checkAuthStatus()
        const hasStoredAuth = sessionStorage.getItem('supabase.auth.token') || localStorage.getItem('supabase.auth.token')

        if (hasAuthCookie || hasStoredAuth) {
          await refreshUser()
        } else {
          setUser(null)
          setIsAdmin(false)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setIsLoading(false)
        }
      }
    }

    // 异步验证认证状态
    const verifyAuthState = async () => {
      try {
        const result = await getCurrentUser()
        if (!result || !result.user) {
          // 认证失效，清除缓存
          setUser(null)
          setIsAdmin(false)
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('userCache')
          }
        }
      } catch (error) {
        console.warn('验证认证状态失败:', error)
      }
    }

    initAuth()

    // 监听认证状态变化，使用防抖避免频繁更新
    let authChangeTimeout: NodeJS.Timeout
    const { data: { subscription } } = onAuthStateChange(async (authUser, isUserAdmin) => {
      if (!mounted) { return }

      // 清除之前的超时
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout)
      }

      // 使用防抖，避免快速连续的状态变化
      authChangeTimeout = setTimeout(async () => {
        if (authUser) {
          try {
            const userData: User = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
              role: isUserAdmin ? 'admin' : 'user',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            }

            setUser(userData)
            setIsAdmin(isUserAdmin)

            // 更新缓存
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem('userCache', JSON.stringify({
                  user: userData,
                  isAdmin: isUserAdmin,
                  timestamp: Date.now()
                }))
              } catch (cacheError) {
                console.warn('缓存用户信息失败:', cacheError)
              }
            }
          } catch (error) {
            console.error('处理认证状态变化失败:', error)
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
              role: isUserAdmin ? 'admin' : 'user',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            })
            setIsAdmin(isUserAdmin)
          }
        } else {
          setUser(null)
          setIsAdmin(false)
          // 清除缓存
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('userCache')
          }
        }

        setIsLoading(false)
      }, 100) // 100ms 防抖延迟
    })

    // 清理函数
    return () => {
      mounted = false
      subscription.unsubscribe()
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout)
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAdmin,
    isLoading,
    isAuthenticated,
    loginRequired,
    showLoginModal,
    setShowLoginModal,
    checkAndRequireAuth,
    refreshUser,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
