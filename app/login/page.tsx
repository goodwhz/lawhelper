'use client'

import React, { useState, useEffect } from 'react'
import { signIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('正在登录...')
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
    
    // 基础验证
    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
      return
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingMessage('正在验证身份...')

    try {
      // 导入错误处理工具
      const { withRetry, getErrorMessage } = await import('@/utils/error-handler')

      // 使用进度消息提升用户体验
      const progressTimer = setTimeout(() => {
        setLoadingMessage('正在连接服务器...')
      }, 2000)

      const result = await withRetry(
        () => signIn({ email, password }),
        {
          maxRetries: 2,
          delay: 1000,
          backoff: true,
          onRetry: (attempt, error) => {
            console.warn(`登录重试第 ${attempt} 次:`, error)
            setLoadingMessage(`正在重试 (${attempt}/3)...`)
          }
        }
      )
      
      clearTimeout(progressTimer)
      setLoadingMessage('登录成功，正在跳转...')

      if (result.success) {
        // 检查是否是管理员
        if (result.user?.email?.includes('admin') || result.isAdmin) {
          setTimeout(() => router.push('/admin'), 500)  // 管理员跳转到后台
        } else {
          setTimeout(() => router.push('/'), 500)      // 普通用户跳转到首页
        }
      } else {
        setError(result.error || getErrorMessage({ message: result.error }) || '登录失败，请检查您的邮箱和密码')
        setLoadingMessage('正在登录...')
      }
    } catch (err: any) {
      console.error('登录异常:', err)
      
      // 使用友好的错误消息
      const { getErrorMessage } = await import('@/utils/error-handler')
      setError(getErrorMessage(err) || '登录失败，请重试')
      setLoadingMessage('正在登录...')
    } finally {
      // 如果登录失败，延迟隐藏加载状态
      if (error) {
        setTimeout(() => setIsLoading(false), 1000)
      } else {
        setTimeout(() => setIsLoading(false), 800)
      }
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    // 清除错误信息
                    if (error && e.target.value.trim()) {
                      setError(null)
                    }
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent transition-colors ${
                    error && !email.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    // 清除错误信息
                    if (error && e.target.value.trim()) {
                      setError(null)
                    }
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent transition-colors ${
                    error && !password.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="请输入密码"
                />
              </div>
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
              <div className="relative">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {loadingMessage}
                    </>
                  ) : (
                    '登录'
                  )}
                </button>
              </div>
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