'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './auth-modal'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  adminOnly?: boolean
}

export default function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = false,
  adminOnly = false 
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, showLoginModal, setShowLoginModal, checkAndRequireAuth } = useAuth()

  // 如果不需要认证，直接渲染子组件
  if (!requireAuth) {
    return <>{children}</>
  }

  // 如果只允许管理员访问
  if (adminOnly) {
    if (!isAuthenticated || !isAdmin) {
      checkAndRequireAuth()
      return fallback || null
    }
    return <>{children}</>
  }

  // 如果需要认证
  if (!isAuthenticated) {
    checkAndRequireAuth()
    return fallback || null
  }

  // 已认证，渲染子组件
  return <>{children}</>
}

// Hook for protecting navigation actions
export function useProtectedAction() {
  const { isAuthenticated, isAdmin, setShowLoginModal, checkAndRequireAuth } = useAuth()

  const executeProtectedAction = (
    action: () => void,
    options?: { requireAuth?: boolean; adminOnly?: boolean }
  ) => {
    const { requireAuth = false, adminOnly = false } = options || {}

    if (requireAuth && !isAuthenticated) {
      setShowLoginModal(true)
      return false
    }

    if (adminOnly && (!isAuthenticated || !isAdmin)) {
      setShowLoginModal(true)
      return false
    }

    action()
    return true
  }

  return { executeProtectedAction }
}

// Higher-order component for protecting components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireAuth?: boolean; adminOnly?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    const { requireAuth = false, adminOnly = false } = options || {}
    
    return (
      <AuthGuard requireAuth={requireAuth} adminOnly={adminOnly}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}