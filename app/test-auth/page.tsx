'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { signIn, signUp, LoginCredentials, RegisterCredentials } from '@/lib/auth'

export default function TestAuthPage() {
  const { user, isAuthenticated, isAdmin, isLoading, checkAndRequireAuth } = useAuth()
  const [testCredentials, setTestCredentials] = useState<LoginCredentials>({
    email: 'admin@lawhelper.com',
    password: 'admin123456'
  })
  const [testRegisterCredentials, setTestRegisterCredentials] = useState<RegisterCredentials>({
    email: 'test@example.com',
    password: 'test123456',
    name: 'Test User'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await signIn(testCredentials)
      setSuccess('登录成功！')
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await signUp(testRegisterCredentials)
      setSuccess('注册成功！请检查邮箱验证（如果需要）')
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { signOut } = await import('@/lib/auth')
      await signOut()
      setSuccess('登出成功！')
    } catch (err: any) {
      setError(err.message || '登出失败')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">认证测试页面</h1>

      {/* 当前认证状态 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">当前认证状态</h2>
        <div className="space-y-2">
          <p>已认证: {isAuthenticated ? '是' : '否'}</p>
          <p>是管理员: {isAdmin ? '是' : '否'}</p>
          {user && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p>用户ID: {user.id}</p>
              <p>邮箱: {user.email}</p>
              <p>姓名: {user.name}</p>
              <p>角色: {user.role}</p>
              <p>注册时间: {user.created_at}</p>
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? '登出中...' : '登出'}
            </button>
          )}
        </div>
      </div>

      {/* 测试登录 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">测试登录</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              value={testCredentials.email}
              onChange={(e) => setTestCredentials({...testCredentials, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="输入邮箱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={testCredentials.password}
              onChange={(e) => setTestCredentials({...testCredentials, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="输入密码"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-4">
          测试管理员账户: admin@lawhelper.com / admin123456
        </p>
      </div>

      {/* 测试注册 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">测试注册</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              value={testRegisterCredentials.email}
              onChange={(e) => setTestRegisterCredentials({...testRegisterCredentials, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="输入邮箱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <input
              type="text"
              value={testRegisterCredentials.name}
              onChange={(e) => setTestRegisterCredentials({...testRegisterCredentials, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={testRegisterCredentials.password}
              onChange={(e) => setTestRegisterCredentials({...testRegisterCredentials, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="输入密码（至少6位）"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}
    </div>
  )
}