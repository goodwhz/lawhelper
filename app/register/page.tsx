'use client'

import React, { useState, useEffect } from 'react'
import { signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { validatePassword, getPasswordRequirements } from '@/utils/password-validation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''))
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const router = useRouter()

  const passwordRequirements = getPasswordRequirements()

  // 实时验证密码
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(validatePassword(''))
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('；'))
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({ email, password, name })
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || '注册失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">注册成功！</h2>
            <p className="text-gray-600">我们已向您的邮箱发送了确认邮件，请点击邮件中的链接完成注册。</p>
            <p className="text-sm text-gray-500 mt-4">您将在3秒后跳转到登录页面...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">创建账户</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </a>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              姓名
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  password && !passwordValidation.isValid 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : password && passwordValidation.isValid 
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300'
                }`}
              />
            </div>
            
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
            
            {password && !passwordValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {passwordValidation.errors.join('；')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}