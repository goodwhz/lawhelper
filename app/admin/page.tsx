'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'
import UserManagement from '@/app/components/admin/UserManagement'
import ProvisionManagement from '@/app/components/admin/ProvisionManagement'
import ConversationManagement from '@/app/components/admin/ConversationManagement'
import TemplateManagement from '@/app/components/admin/TemplateManagement'
import EvaluationManagement from '@/app/components/admin/EvaluationManagement'

function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'templates' | 'conversations' | 'evaluations' | 'sync' | 'settings'>('users')

  const tabs = [
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'content', label: '条文管理', icon: '📚' },
    { id: 'templates', label: '模板管理', icon: '📄' },
    { id: 'conversations', label: '对话记录', icon: '💬' },
    { id: 'evaluations', label: '测评管理', icon: '🐂' },
  ]

  return (
    <ErrorBoundary>
      <PageAuthGuard adminOnly={true}>
        <div className="min-h-screen bg-gray-50">
          {/* 导航栏 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="后台管理" />

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
              <div className="grid grid-cols-3 gap-2">
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
                  <ProvisionManagement />
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">文书模板管理</h2>
                    <p className="text-gray-600 text-sm lg:text-base">管理系统中的文书模板，包括查看模板详情、管理发布状态、查看下载统计等操作。</p>
                  </div>
                  <TemplateManagement />
                </div>
              )}

              {activeTab === 'conversations' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">对话记录管理</h2>
                    <p className="text-gray-600 text-sm lg:text-base">查看和管理用户对话记录，包括查看对话详情、删除对话等操作。</p>
                  </div>
                  <ConversationManagement />
                </div>
              )}

              {activeTab === 'evaluations' && (
                <div className="p-4 lg:p-6">
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">测评管理</h2>
                    <p className="text-gray-600 text-sm lg:text-base">查看和管理牛马测评仪的测评记录，包括查看测评详情、测评结果、删除测评等操作。</p>
                  </div>
                  <EvaluationManagement />
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
