'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProtectedAction } from './auth-guard'
import { signOut } from '@/lib/auth'
import WeChatModal from './wechat-modal'

const Navigation: FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  
  // 安全地获取 auth 状态
  let authState: any = {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    setShowLoginModal: () => {}
  }
  let executeProtectedAction: any = () => {}
  
  try {
    authState = useAuth()
    const { executeProtectedAction: protectedAction } = useProtectedAction()
    executeProtectedAction = protectedAction
  } catch (error) {
    console.warn('Auth context not available, using fallback')
    executeProtectedAction = (action: Function) => action()
  }
  
  const { user, isAuthenticated, isAdmin, isLoading, setShowLoginModal } = authState
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = []

  const isActive = (href: string) => {
    if (href === '/') { return pathname === '/' }
    return pathname.startsWith(href)
  }

  // 处理功能点击
  const handleFeatureClick = (href: string) => {
    executeProtectedAction(() => {
      router.push(href)
    }, { requireAuth: true })
  }

  // 处理登出
  const handleLogout = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
      // 可以添加登出成功提示
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 检查是否为主页
  const isHomePage = pathname === '/'

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            {/* 左侧区域 - Logo */}
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

              {/* 登录状态 */}
              {isLoading ? (
                <div className="w-20 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : !isAuthenticated ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-law-orange-500 text-white px-4 py-2 rounded-lg hover:bg-law-orange-600 transition-colors font-medium"
                >
                  登录
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    <span className="truncate max-w-[100px]">{user?.name || user?.email}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 用户下拉菜单 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        {isAdmin && (
                          <p className="text-xs text-law-red-500 font-medium">管理员</p>
                        )}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => { router.push('/admin'); setShowUserMenu(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          后台管理
                        </button>
                      )}

                      <button
                        onClick={() => { router.push('/profile'); setShowUserMenu(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        个人资料
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 返回主页按钮 - 网页最右端 */}
            {!isHomePage && (
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center shadow-sm hover:shadow-md transform hover:scale-105 ml-6"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                返回主页
              </button>
            )}
          </div>

          {/* 移动端导航 - 暂时隐藏，因为navItems为空 */}
          {navItems.length > 0 && (
            <div className="md:hidden border-t border-gray-200 mt-2 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => handleFeatureClick(item.href)}
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
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 点击外部关闭用户菜单 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* 微信客服模态框 */}
      <WeChatModal
        isOpen={isWeChatModalOpen}
        onClose={() => setIsWeChatModalOpen(false)}
      />
    </>
  )
}

export default Navigation