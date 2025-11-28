'use client'

import React, { useState, useEffect } from 'react'
import { signIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // 检查URL参数中是否有错误信息
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn({ email, password })
      
      if (result.success) {
        // 检查是否是管理员
        if (result.data?.user?.email?.includes('admin')) {
          router.push('/admin')  // 管理员跳转到后台
        } else {
          router.push('/')      // 普通用户跳转到首页
        }
      } else {
        setError(result.error || '登录失败，请检查您的邮箱和密码')
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.jpeg"
              alt="法律助手Logo"
              className="h-16 w-auto rounded-lg object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录到您的冷静头脑账户</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
                placeholder="请输入邮箱地址"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
                placeholder="请输入密码"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/reset-password')
                  }}
                  className="text-law-red-500 hover:text-law-red-600 font-medium"
                >
                  忘记密码？
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
          
          {/* 注册链接 */}
          <div className="mt-6 text-center border-t border-gray-200 pt-6">
            <p className="text-gray-600">
              还没有账户？{' '}
              <a href="/register" className="text-law-red-500 hover:text-law-red-600 font-medium">
                立即注册
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}