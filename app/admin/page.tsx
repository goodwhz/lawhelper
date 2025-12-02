'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'
import UserManagement from '@/app/components/admin/UserManagement'

function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'settings'>('users')

  const tabs = [
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'content', label: '内容管理', icon: '📚' },
    { id: 'settings', label: '系统设置', icon: '⚙️' }
  ]

  return (
    <ErrorBoundary>
      <PageAuthGuard adminOnly={true}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">后台管理系统</h1>
                <p className="mt-1 text-sm text-gray-600">
                  欢迎回来，{user?.email}（管理员）
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Tab导航 */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
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

              {/* Tab内容 */}
              <div className="bg-white rounded-lg shadow">
                {activeTab === 'users' && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">用户管理</h2>
                      <p className="text-gray-600">管理系统用户账户和权限，包括查看用户信息、修改用户角色、删除用户等操作。</p>
                    </div>
                    <UserManagement />
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">内容管理</h2>
                      <p className="text-gray-600">管理法律文档和分类，包括文档的添加、编辑、删除和分类管理。</p>
                    </div>
                    
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">内容管理功能</h3>
                      <p className="text-gray-600 mb-4">
                        此功能正在开发中，敬请期待。<br />
                        将包括：法律文档管理、分类管理、内容审核等功能。
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">📄</div>
                          <h4 className="font-medium text-gray-900 mb-1">文档管理</h4>
                          <p className="text-sm text-gray-600">添加、编辑、删除法律文档</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">🏷️</div>
                          <h4 className="font-medium text-gray-900 mb-1">分类管理</h4>
                          <p className="text-sm text-gray-600">管理文档分类和标签</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">📊</div>
                          <h4 className="font-medium text-gray-900 mb-1">内容统计</h4>
                          <p className="text-sm text-gray-600">查看文档访问统计和分析</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">系统设置</h2>
                      <p className="text-gray-600">配置系统参数和选项，包括系统配置、权限设置、日志管理等。</p>
                    </div>
                    
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">⚙️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">系统设置功能</h3>
                      <p className="text-gray-600 mb-4">
                        此功能正在开发中，敬请期待。<br />
                        将包括：系统配置、权限管理、日志查看、备份恢复等功能。
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">🔧</div>
                          <h4 className="font-medium text-gray-900 mb-1">系统配置</h4>
                          <p className="text-sm text-gray-600">基本系统参数设置</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">📋</div>
                          <h4 className="font-medium text-gray-900 mb-1">日志管理</h4>
                          <p className="text-sm text-gray-600">系统日志查看和分析</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">💾</div>
                          <h4 className="font-medium text-gray-900 mb-1">数据备份</h4>
                          <p className="text-sm text-gray-600">数据备份和恢复功能</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AdminPage