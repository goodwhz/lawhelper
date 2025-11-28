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
      const result = await getCurrentUser()
      if (result) {
        // 导入并使用 getUserProfile 函数
        const { getUserProfile } = await import('@/lib/auth')
        let profile = null

        try {
          profile = await getUserProfile(result.user.id)
        } catch (profileError) {
          console.warn('获取用户资料失败:', profileError)
        }

        const userData: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: profile?.name || result.user.user_metadata?.name || result.user.email?.split('@')[0] || '',
          role: profile?.role || (result.isAdmin ? 'admin' : 'user'),
          created_at: result.user.created_at,
          updated_at: profile?.updated_at || result.user.updated_at,
        }

        setUser(userData)
        setIsAdmin(result.isAdmin)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      setUser(null)
      setIsAdmin(false)
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

  useEffect(() => {
    let mounted = true

    // 初始化认证状态
    const initAuth = async () => {
      try {
        // 先检查cookie状态
        const hasAuthCookie = checkAuthStatus()

        if (hasAuthCookie) {
          // 有登录cookie，获取用户信息
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

    initAuth()

    // 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange(async (authUser, isUserAdmin) => {
      if (!mounted) { return }

      if (authUser) {
        try {
          // 导入并使用 getUserProfile 函数
          const { getUserProfile } = await import('@/lib/auth')
          let profile = null

          try {
            profile = await getUserProfile(authUser.id)
          } catch (profileError) {
            console.warn('获取用户资料失败:', profileError)
          }

          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
            role: profile?.role || (isUserAdmin ? 'admin' : 'user'),
            created_at: authUser.created_at,
            updated_at: profile?.updated_at || authUser.updated_at,
          }

          setUser(userData)
          setIsAdmin(isUserAdmin)
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
      }

      setIsLoading(false)
    })

    // 清理函数
    return () => {
      mounted = false
      subscription.unsubscribe()
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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
