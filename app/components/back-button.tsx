'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface BackButtonProps {
  to?: string
  label?: string
  variant?: 'home' | 'back' | 'custom'
  className?: string
}

export default function BackButton({ 
  to, 
  label, 
  variant = 'back', 
  className = '' 
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  // 确定默认路由
  const getDefaultRoute = () => {
    if (to) return to
    if (pathname === '/') return '/'
    if (pathname.startsWith('/admin')) return '/admin'
    if (pathname.startsWith('/profile')) return '/'
    return '/'
  }

  // 确定默认标签
  const getDefaultLabel = () => {
    if (label) return label
    if (variant === 'home') return '返回主页'
    if (variant === 'back') return '返回'
    return '返回'
  }

  const handleBack = () => {
    if (window.history.length > 1 && !to) {
      router.back()
    } else {
      router.push(getDefaultRoute())
    }
  }

  const buttonStyles = {
    home: 'bg-gradient-to-r from-law-red-500 to-law-red-600 text-white hover:from-law-red-600 hover:to-law-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200',
    back: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200',
    custom: className
  }

  const iconStyles = {
    home: (
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    back: (
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
    custom: null
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${buttonStyles[variant]}`}
    >
      {iconStyles[variant]}
      {getDefaultLabel()}
    </button>
  )
}