'use client'

import { useAuth } from '@/contexts/AuthContext'

export function useSupabaseAuth() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  return {
    user,
    isAuthenticated,
    isLoading,
  }
}