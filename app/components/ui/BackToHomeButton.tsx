'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackToHomeButtonProps {
  className?: string
  variant?: 'default' | 'mobile' | 'desktop'
}

/**
 * 返回主页按钮组件
 */
const BackToHomeButton: React.FC<BackToHomeButtonProps> = ({ 
  className = '',
  variant = 'default' 
}) => {
  const router = useRouter()

  const handleClick = () => {
    router.push('/')
  }

  const baseClasses = "flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
  
  const variantClasses = {
    default: "text-law-orange-600 hover:text-law-orange-700",
    mobile: "text-law-orange-600 hover:text-law-orange-700 mobile-ripple bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200",
    desktop: "text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
  }

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="返回主页"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">返回主页</span>
      <span className="sm:hidden">返回</span>
    </button>
  )
}

export default BackToHomeButton