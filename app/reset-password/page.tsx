'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { validatePassword, getPasswordRequirements } from '@/utils/password-validation'
import { updatePassword } from '@/lib/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [processing, setProcessing] = useState(true)
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''))
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  const passwordRequirements = getPasswordRequirements()

  // 实时验证密码
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(validatePassword(''))
    }
  }, [formData.password])

  // 检查URL中的令牌
  useEffect(() => {
    const checkResetTokens = async () => {
      try {
        // Supabase会在页面加载时自动处理URL中的令牌
        // 我们需要等待一下让Supabase处理URL
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 获取当前用户状态
        const { data, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('获取用户状态失败:', error)
          setError('无效的重置链接或链接已过期')
          setIsValid(false)
        } else if (data.user) {
          console.log('用户状态验证成功:', data.user.email)
          setIsValid(true)
        } else {
          // 尝试从hash中获取令牌
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const type = hashParams.get('type')
          
          if (accessToken && type === 'recovery') {
            console.log('从hash中获取到重置令牌')
            setIsValid(true)
          } else {
            // 尝试从search中获取
            const searchParams = new URLSearchParams(window.location.search)
            const searchToken = searchParams.get('access_token')
            const searchType = searchParams.get('type')
            
            if (searchToken && searchType === 'recovery') {
              console.log('从search中获取到重置令牌')
              setIsValid(true)
            } else {
              console.log('未找到有效的重置令牌')
              setError('这不是一个有效的密码重置链接')
              setIsValid(false)
            }
          }
        }
      } catch (err) {
        console.error('检查重置令牌时出错:', err)
        setError('验证重置链接时发生错误')
        setIsValid(false)
      } finally {
        setProcessing(false)
      }
    }

    checkResetTokens()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.password) {
      setError('请输入新密码')
      return false
    }

    // 验证密码策略
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('；'))
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      console.log('开始更新密码...')
      
      // 使用包含验证的updatePassword函数
      const result = await updatePassword(formData.password)

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('密码更新成功')
      setSuccess('密码重置成功！正在跳转到登录页面...')
      
      // 2秒后跳转
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error: any) {
      console.error('密码重置失败:', error)
      setError(error.message || '密码重置失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理中状态
  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">验证重置链接...</h2>
          <p className="text-gray-600 mt-2">请稍候，我们正在验证您的重置链接</p>
        </div>
      </div>
    )
  }

  // 无效链接状态
  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">链接无效</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-law-red-500 text-white py-2 px-4 rounded-lg hover:bg-law-red-600 transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              重新申请重置
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 正常重置密码表单
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">设置新密码</h2>
          <p className="text-gray-600 mt-2">请输入您的新密码</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新密码
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 ${
                formData.password && !passwordValidation.isValid 
                  ? 'border-red-300 focus:ring-red-500' 
                  : formData.password && passwordValidation.isValid 
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-300'
              }`}
              placeholder="请输入新密码"
              disabled={isLoading}
              required
            />
            
            {showPasswordRequirements && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">密码要求：</h4>
                <ul className="space-y-1">
                  {passwordRequirements.map((requirement, index) => {
                    const isMet = (
                      (index === 0 && passwordValidation.requirements.length) ||
                      (index === 1 && passwordValidation.requirements.hasLowercase) ||
                      (index === 2 && passwordValidation.requirements.hasUppercase) ||
                      (index === 3 && passwordValidation.requirements.hasNumber)
                    )
                    return (
                      <li key={index} className={`text-xs flex items-center ${
                        isMet ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        <span className="mr-2">
                          {isMet ? '✓' : '○'}
                        </span>
                        {requirement}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            
            {formData.password && !passwordValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {passwordValidation.errors.join('；')}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认新密码
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500"
              placeholder="请再次输入新密码"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full bg-law-red-500 text-white py-3 px-4 rounded-lg hover:bg-law-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                更新密码中...
              </div>
            ) : (
              '重置密码'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}