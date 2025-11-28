'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface PageAuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  adminOnly?: boolean
}

export default function PageAuthGuard({ 
  children, 
  requireAuth = false,
  adminOnly = false 
}: PageAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isAdmin, isLoading, checkAndRequireAuth } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // 如果不需要认证，直接返回
    if (!requireAuth) {
      return
    }

    // 如果还在加载中，等待
    if (isLoading) {
      return
    }

    // 如果只允许管理员访问
    if (adminOnly) {
      if (!isAuthenticated || !isAdmin) {
        // 延迟跳转，避免chunk加载错误
        const timer = setTimeout(() => {
          setShouldRedirect(true)
          // 使用window.location进行跳转，避免Next.js路由问题
          window.location.href = '/login'
        }, 100)
        return () => clearTimeout(timer)
      }
    }

    // 如果需要认证但未认证
    if (requireAuth && !isAuthenticated) {
      // 延迟跳转，避免chunk加载错误
      const timer = setTimeout(() => {
        setShouldRedirect(true)
        // 使用window.location进行跳转，避免Next.js路由问题
        window.location.href = '/login'
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isAdmin, isLoading, pathname, requireAuth, adminOnly])

  // 如果在加载中，显示加载状态
  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  // 如果需要认证但未认证，显示空白（等待跳转）
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {shouldRedirect ? '正在跳转到登录页面...' : '需要登录才能访问此页面'}
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-law-red-500 text-white px-6 py-2 rounded-lg hover:bg-law-red-600 transition-colors"
          >
            立即登录
          </button>
        </div>
      </div>
    )
  }

  // 如果只允许管理员但用户不是管理员，显示空白（等待跳转）
  if (adminOnly && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {shouldRedirect ? '正在验证权限...' : '需要管理员权限才能访问此页面'}
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-law-red-500 text-white px-6 py-2 rounded-lg hover:bg-law-red-600 transition-colors"
          >
            立即登录
          </button>
        </div>
      </div>
    )
  }

  // 通过验证，渲染子组件
  return <>{children}</>
}