'use client'

import React, { useState, useEffect } from 'react'
import { signIn, signUp, resetPassword, LoginCredentials, RegisterCredentials } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'login' | 'register' | 'forgot'

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { refreshUser } = useAuth()
  const router = useRouter()
  
  // 表单状态
  const [mode, setMode] = useState<AuthMode>('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 重置表单状态
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
    setIsLoading(false)
  }

  // 切换模式时重置表单
  useEffect(() => {
    if (isOpen) {
      resetForm()
      setMode('login')
    }
  }, [isOpen])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  // 验证表单
  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return false
    }

    if (mode !== 'forgot' && !formData.password) {
      setError('请输入密码')
      return false
    }

    if (mode === 'register') {
      if (formData.password.length < 6) {
        setError('密码长度至少6位')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致')
        return false
      }
    }

    return true
  }

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const credentials: LoginCredentials = {
        email: formData.email,
        password: formData.password
      }

      const result = await signIn(credentials)
      
      if (result.success) {
        setSuccess('登录成功！')
        
        // 刷新用户信息
        await refreshUser()
        
        // 管理员跳转到后台
        if (result.isAdmin) {
          setTimeout(() => {
            onClose()
            router.push('/admin')
          }, 1000)
        } else {
          setTimeout(() => {
            onClose()
          }, 500)
        }
      } else {
        setError(result.error || '登录失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const credentials: RegisterCredentials = {
        email: formData.email,
        password: formData.password,
        name: formData.name
      }

      const result = await signUp(credentials)
      
      if (result.success) {
        setSuccess('注册成功！请查收邮件确认账户')
        setIsAdmin(result.isAdmin || false)
        
        // 刷新用户信息
        await refreshUser()
        
        // 注册后切换到登录模式
        setTimeout(() => {
          setMode('login')
          resetForm()
        }, 2000)
      } else {
        setError(result.error || '注册失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理忘记密码
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await resetPassword(formData.email)
      setSuccess('密码重置邮件已发送，请查收邮件')
      
      // 2秒后切换回登录模式
      setTimeout(() => {
        setMode('login')
        resetForm()
      }, 2000)
    } catch (err: any) {
      setError(err.message || '发送重置邮件失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === 'login') {
      handleLogin(e)
    } else if (mode === 'register') {
      handleRegister(e)
    } else if (mode === 'forgot') {
      handleForgotPassword(e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 头部 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? '登录账号' : mode === 'register' ? '注册账号' : '重置密码'}
          </h2>
          <p className="text-gray-600 text-sm">
            {mode === 'login' ? '登录后使用所有功能' : 
             mode === 'register' ? '创建新账号开始使用' :
             '输入邮箱地址，我们将发送重置链接'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名（选填）
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
                placeholder="请输入您的姓名"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
              placeholder="请输入邮箱地址"
              disabled={isLoading}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
                placeholder={mode === 'login' ? '请输入密码' : '请设置密码（至少6位）'}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent"
                placeholder="请再次输入密码"
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功信息 */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full bg-law-red-500 text-white py-2 px-4 rounded-lg hover:bg-law-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'login' ? '登录中...' : mode === 'register' ? '注册中...' : '发送中...'}
              </span>
            ) : (
              (mode === 'login' ? '登录' : mode === 'register' ? '注册' : '发送重置邮件')
            )}
          </button>
        </form>

        {/* 底部链接 */}
        <div className="mt-6 text-center text-sm">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => { setMode('forgot'); resetForm(); }}
                className="text-law-red-500 hover:text-law-red-600 transition-colors"
                disabled={isLoading}
              >
                忘记密码？
              </button>
              <div className="mt-2 text-gray-600">
                还没有账号？
                <button
                  type="button"
                  onClick={() => { setMode('register'); resetForm(); }}
                  className="ml-1 text-law-red-500 hover:text-law-red-600 transition-colors"
                  disabled={isLoading}
                >
                  立即注册
                </button>
              </div>
            </>
          )}
          
          {mode === 'register' && (
            <div className="text-gray-600">
              已有账号？
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="ml-1 text-law-red-500 hover:text-law-red-600 transition-colors"
                disabled={isLoading}
              >
                立即登录
              </button>
            </div>
          )}
          
          {mode === 'forgot' && (
            <div className="text-gray-600">
              记起密码了？
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="ml-1 text-law-red-500 hover:text-law-red-600 transition-colors"
                disabled={isLoading}
              >
                返回登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}