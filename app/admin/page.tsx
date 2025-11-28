'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'

function AdminPage() {
  const { user } = useAuth()

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
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">管理功能</h2>
                <p className="text-gray-600 mb-6">
                  后台管理功能正在开发中，敬请期待。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">用户管理</h3>
                    <p className="text-gray-600">管理系统用户账户和权限</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">内容管理</h3>
                    <p className="text-gray-600">管理法律文档和分类</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">系统设置</h3>
                    <p className="text-gray-600">配置系统参数和选项</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AdminPage