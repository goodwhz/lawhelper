'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WeChatModal from './wechat-modal'

const Navigation: FC = () => {
  const pathname = usePathname()
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false)

  const navItems = []

  const isActive = (href: string) => {
    if (href === '/') { return pathname === '/' }
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            {/* Logo区域 - 置于最左边 */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpeg"
                alt="法律助手Logo"
                className="h-12 w-auto rounded-lg object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">冷静头脑</h1>
              </div>
            </div>

            {/* 中间区域 - 保持空 */}
            <div className="flex-1"></div>

            {/* 用户操作区域 - 置于最右边 */}
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
