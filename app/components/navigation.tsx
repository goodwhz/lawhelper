'use client'
import type { FC } from 'react'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation: FC = () => {
  const pathname = usePathname()

  const navItems = [
    { 
      id: 'home', 
      label: '首页', 
      icon: '🏠', 
      description: '综合功能',
      href: '/'
    },
    { 
      id: 'ai', 
      label: '智能核心', 
      icon: '🤖', 
      description: 'AI劳动法助手',
      href: '/ai-chat'
    },
    { 
      id: 'tools', 
      label: '劳动法工具箱', 
      icon: '🛠️', 
      description: '实用计算工具',
      href: '/tools'
    },
    { 
      id: 'knowledge', 
      label: '法律知识库', 
      icon: '📚', 
      description: '法规与文书模板',
      href: '/knowledge-base'
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-lg rounded-lg mx-4 mb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex flex-col items-center py-4 px-6 transition-all duration-200
                ${isActive(item.href) 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-500'
                }
              `}
            >
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="font-semibold text-lg">{item.label}</span>
              <span className="text-sm text-gray-500 mt-1">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation