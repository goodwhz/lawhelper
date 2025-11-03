'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WeChatModal from './wechat-modal'

const Navigation: FC = () => {
  const pathname = usePathname()
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false)

  const navItems = [
    {
      id: 'home',
      label: '首页',
      icon: '🏠',
      description: '综合功能',
      href: '/',
    },
    {
      id: 'ai',
      label: '智能核心',
      icon: '🤖',
      description: 'AI劳动法助手',
      href: '/ai-chat',
    },
    {
      id: 'tools',
      label: '劳动法工具箱',
      icon: '🛠️',
      description: '实用计算工具',
      href: '/tools',
    },
    {
      id: 'knowledge',
      label: '法律知识库',
      icon: '📚',
      description: '法规与文书模板',
      href: '/knowledge-base',
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') { return pathname === '/' }
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            {/* Logo区域 */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-law-red-500 to-law-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">法</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI劳动法助手</h1>
                <p className="text-sm text-gray-500">专业的法律服务平台</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <div className="hidden md:flex space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    group relative py-2 px-4 transition-all duration-300 rounded-lg
                    ${isActive(item.href)
                  ? 'bg-law-red-50 text-law-red-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-law-red-500'
                }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive(item.href) && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-law-red-500 rounded-full"></div>
                  )}
                  <div className="absolute inset-0 bg-law-red-500 opacity-0 group-hover:opacity-5 transition-opacity rounded-lg"></div>
                </Link>
              ))}
            </div>

            {/* 用户操作区域 */}
            <div className="flex items-center space-x-3">
              <Link href="/about" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                关于
              </Link>
              <button
                onClick={() => setIsWeChatModalOpen(true)}
                className="bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 transition-colors font-medium"
              >
                在线咨询
              </button>
            </div>
          </div>

          {/* 移动端导航 */}
          <div className="md:hidden border-t border-gray-200 mt-2 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-300
                    ${isActive(item.href)
                  ? 'bg-law-red-50 text-law-red-600 font-semibold'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }
                  `}
                >
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 微信客服模态框 */}
      <WeChatModal
        isOpen={isWeChatModalOpen}
        onClose={() => setIsWeChatModalOpen(false)}
      />
    </>
  )
}

export default Navigation
