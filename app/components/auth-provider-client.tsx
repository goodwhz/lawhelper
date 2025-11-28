'use client'

import React from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AuthModal from './auth-modal'
import ErrorBoundary from './error-boundary'

export default function AuthProviderClient({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <AuthModalWrapper />
      </AuthProvider>
    </ErrorBoundary>
  )
}

function AuthModalWrapper() {
  const { showLoginModal, setShowLoginModal } = useAuth()
  
  if (!showLoginModal) return null
  
  return (
    <AuthModal 
      isOpen={showLoginModal} 
      onClose={() => setShowLoginModal(false)} 
    />
  )
}