'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProtectedAction } from './auth-guard'
import { signOut } from '@/lib/auth'
import WeChatModal from './wechat-modal'

const MobileNavigation: FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 始终在组件顶层调用hooks，保持调用顺序
  const authState = useAuth()
  const protectedAction = useProtectedAction()

  const { user, isAuthenticated, isAdmin, setShowLoginModal } = authState
  // const isLoading = authState.isLoading // 暂时未使用
  const { executeProtectedAction } = protectedAction
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false)

  // 监听存储事件以强制重新渲染
  useEffect(() => {
    const handleStorageChange = () => {
      setIsMenuOpen(false)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 处理功能点击
  const handleFeatureClick = (href: string) => {
    executeProtectedAction(() => {
      router.push(href)
      setIsMenuOpen(false)
    }, { requireAuth: true })
  }

  // 处理登出
  const handleLogout = async () => {
    try {
      await signOut()
      setIsMenuOpen(false)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 检查是否为主页
  // const isHomePage = pathname === '/' // 暂时未使用

  // 关闭菜单
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      {/* 移动端导航栏 */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-50">
        <div className="px-4">
          <div className="flex justify-between items-center py-3">
            {/* Logo区域 */}
            <div className="flex items-center space-x-2">
              <img
                src="/logo.jpeg"
                alt="法律助手Logo"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">冷静头脑</h1>
              </div>
            </div>

            {/* 右侧操作区域 */}
            <div className="flex items-center space-x-2">
              {/* 在线咨询按钮 */}
              <button
                onClick={() => setIsWeChatModalOpen(true)}
                className="bg-law-red-500 text-white px-3 py-1.5 rounded-md hover:bg-law-red-600 transition-colors text-sm font-medium"
              >
                咨询
              </button>

              {/* 菜单按钮 */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="菜单"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen
                    ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )
                    : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端侧边菜单 */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMenu}
          />

          {/* 侧边栏内容 */}
          <div className="relative flex flex-col w-80 max-w-full bg-white shadow-xl">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <img
                  src="/logo.jpeg"
                  alt="法律助手Logo"
                  className="h-8 w-auto rounded-lg object-contain"
                />
                <h2 className="text-lg font-bold text-gray-900">菜单</h2>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="关闭菜单"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 导航内容 */}
            <div className="flex-1 overflow-y-auto">
              {/* 用户信息区域 */}
              {isAuthenticated && user && (
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-law-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || '用户'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-law-orange-100 text-law-orange-800">
                          管理员
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 主要功能菜单 */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">主要功能</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFeatureClick('/ai-chat')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">🤖</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">智能法律咨询</p>
                      <p className="text-xs text-gray-500">专业法律问答服务</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleFeatureClick('/tools')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">🛠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">劳动法工具箱</p>
                      <p className="text-xs text-gray-500">赔偿计算等实用工具</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleFeatureClick('/knowledge-base')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">📚</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">法律知识库</p>
                      <p className="text-xs text-gray-500">法规查询与案例参考</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleFeatureClick('/dispute-center')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">⚖️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">争议解决中心</p>
                      <p className="text-xs text-gray-500">专业争议处理指导</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 用户操作区域 */}
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">账户</h3>
                <div className="space-y-2">
                  {!isAuthenticated
                    ? (
                      <>
                        <button
                          onClick={() => {
                            setShowLoginModal(true)
                            closeMenu()
                          }}
                          className="w-full bg-law-red-500 text-white px-3 py-2 rounded-md hover:bg-law-red-600 transition-colors font-medium"
                        >
                          登录
                        </button>
                        <Link
                          href="/about"
                          className="block w-full text-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                          onClick={closeMenu}
                        >
                          关于我们
                        </Link>
                      </>
                    )
                    : (
                      <>
                        <button
                          onClick={() => {
                            setIsWeChatModalOpen(true)
                            closeMenu()
                          }}
                          className="w-full bg-law-red-500 text-white px-3 py-2 rounded-md hover:bg-law-red-600 transition-colors font-medium"
                        >
                          在线咨询
                        </button>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block w-full text-center bg-law-orange-500 text-white px-3 py-2 rounded-md hover:bg-law-orange-600 transition-colors font-medium"
                            onClick={closeMenu}
                          >
                            管理后台
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                        >
                          退出登录
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WeChat弹窗 */}
      <WeChatModal
        isOpen={isWeChatModalOpen}
        onClose={() => setIsWeChatModalOpen(false)}
      />
    </>
  )
}

export default MobileNavigation
