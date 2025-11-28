'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestSimplePage() {
  const { user, isAuthenticated, isAdmin, checkAndRequireAuth, setShowLoginModal } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">登录系统测试页面</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">用户状态</h2>
          <div className="space-y-2">
            <p>已登录: {isAuthenticated ? '是' : '否'}</p>
            <p>是管理员: {isAdmin ? '是' : '否'}</p>
            {user && (
              <div>
                <p>用户ID: {user.id}</p>
                <p>邮箱: {user.email}</p>
                <p>姓名: {user.name}</p>
                <p>角色: {user.role}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">测试操作</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                if (checkAndRequireAuth()) {
                  alert('您已登录，可以访问此功能')
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              测试需要登录的功能
            </button>
            
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
            >
              打开登录弹窗
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">快速链接</h2>
          <div className="space-y-2">
            <a href="/register" className="block text-blue-500 hover:underline">注册新账户</a>
            <a href="/login" className="block text-blue-500 hover:underline">登录页面</a>
            <a href="/tools" className="block text-blue-500 hover:underline">工具页面（测试登录弹窗）</a>
            {isAdmin && <a href="/admin" className="block text-blue-500 hover:underline">管理后台</a>}
          </div>
        </div>
      </div>
    </div>
  )
}