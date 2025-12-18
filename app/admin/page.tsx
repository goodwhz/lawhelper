'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/app/components/navigation'
import MobileNavigation from '@/app/components/mobile-navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'
import UserManagement from '@/app/components/admin/UserManagement'
import ContentManagement from '@/app/components/admin/ContentManagement'
import SyncMonitor from '@/app/components/admin/SyncMonitor'

function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'sync' | 'settings'>('users')

  const tabs = [
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'content', label: '内容管理', icon: '📚' },
    { id: 'sync', label: '数据同步', icon: '🔄' },
    { id: 'settings', label: '系统设置', icon: '⚙️' },
  ]

  return (
    <ErrorBoundary>
      <PageAuthGuard adminOnly={true}>
        <div className="min-h-screen bg-gray-50">
          {/* 桌面端导航 */}
          <div className="hidden lg:block">
            <Navigation />
          </div>
          
          {/* 移动端页面头部 */}
          <div className="lg:hidden">
            <MobilePageHeader title="后台管理" />
          </div>

          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto pt-24 pb-6 px-4 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">后台管理系统</h1>
                <p className="mt-1 text-sm text-gray-600 mobile-text-base">
                  欢迎回来，{user?.email}（管理员）
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {/* 移动端Tab导航 - 垂直布局 */}
            <div className="lg:hidden mb-4">
              <div className="grid grid-cols-2 gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`mobile-ripple py-3 px-2 rounded-lg border-2 font-medium text-sm touch-target ${
                      activeTab === tab.id
                        ? 'border-law-blue-500 bg-law-blue-50 text-law-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xl mb-1">{tab.icon}</div>
                    <div className="text-xs">{tab.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 桌面端Tab导航 - 水平布局 */}
            <div className="hidden lg:block">
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab内容 - 移动端优化 */}
            <div className="bg-white rounded-lg shadow">
              {activeTab === 'users' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">用户管理</h2>
                    <p className="text-gray-600 text-sm lg:text-base">管理系统用户账户和权限，包括查看用户信息、修改用户角色、删除用户等操作。</p>
                  </div>
                  <UserManagement />
                </div>
              )}

              {activeTab === 'content' && (
                <div>
                  <ContentManagement />
                </div>
              )}

              {activeTab === 'sync' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">用户数据同步监控</h2>
                    <p className="text-gray-600 text-sm lg:text-base">实时监控数据库表 user_profiles 与 Supabase Auth 用户的同步状态，支持手动强制同步。</p>
                  </div>
                  <SyncMonitor />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">系统设置</h2>
                    <p className="text-gray-600 text-sm lg:text-base">配置系统参数和选项，包括系统配置、权限设置、日志管理等。</p>
                  </div>

                  <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 lg:p-8 text-center">
                    <div className="text-4xl lg:text-6xl mb-4">⚙️</div>
                    <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">系统设置功能</h3>
                    <p className="text-gray-600 mb-4 text-sm lg:text-base">
                      此功能正在开发中，敬请期待。<br />
                      将包括：系统配置、权限管理、日志查看、备份恢复等功能。
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-6">
                      <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                        <div className="text-xl lg:text-2xl mb-2">🔧</div>
                        <h4 className="font-medium text-gray-900 mb-1 text-sm lg:text-base">系统配置</h4>
                        <p className="text-xs lg:text-sm text-gray-600">基本系统参数设置</p>
                      </div>
                      <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                        <div className="text-xl lg:text-2xl mb-2">📋</div>
                        <h4 className="font-medium text-gray-900 mb-1 text-sm lg:text-base">日志管理</h4>
                        <p className="text-xs lg:text-sm text-gray-600">系统日志查看和分析</p>
                      </div>
                      <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                        <div className="text-xl lg:text-2xl mb-2">💾</div>
                        <h4 className="font-medium text-gray-900 mb-1 text-sm lg:text-base">数据备份</h4>
                        <p className="text-xs lg:text-sm text-gray-600">数据备份和恢复功能</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AdminPage
