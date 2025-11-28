'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import AuthModal from './auth-modal'

interface AuthContextType {
  user: any
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



export default function AuthProviderSimple({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const isAuthenticated = !!user
  const loginRequired = showLoginModal && !isAuthenticated

  const checkAndRequireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      setShowLoginModal(true)
      return false
    }
    return true
  }

  const refreshUser = async () => {
    // 简化版本，暂时不实现
    setIsLoading(false)
  }

  const value: AuthContextType = {
    user,
    isAdmin,
    isLoading,
    isAuthenticated,
    loginRequired,
    showLoginModal,
    setShowLoginModal,
    checkAndRequireAuth,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLoginModal && (
        <AuthModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </AuthContext.Provider>
  )
}