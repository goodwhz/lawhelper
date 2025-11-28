'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { withAuth } from '@/app/components/auth-guard'
import { signOut, getCurrentUser, updateUserProfile, getUserProfile, resetPassword } from '@/lib/auth'
import Navigation from '@/app/components/navigation'
import { supabase } from '@/lib/supabaseClient'

interface UserProfile {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

function ProfilePage() {
  const { user, isAdmin, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const result = await getCurrentUser()
      if (result && result.user) {
        // 使用新的获取用户资料函数
        const profileData = await getUserProfile(result.user.id)
        
        const userProfile: UserProfile = {
          id: result.user.id,
          email: result.user.email || '',
          name: profileData?.name || result.user.user_metadata?.name || result.user.email?.split('@')[0] || '',
          role: profileData?.role || (result.isAdmin ? 'admin' : 'user'),
          created_at: result.user.created_at,
          updated_at: profileData?.updated_at || result.user.updated_at,
        }

        console.log('加载用户资料:', userProfile)
        setProfile(userProfile)
        setFormData({
          name: userProfile.name,
          email: userProfile.email,
        })
      }
    } catch (error) {
      console.error('加载用户资料失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) { return }

    setSaveLoading(true)
    setMessage('')

    try {
      console.log('=== 开始保存个人资料 ===')
      
      // 使用新的更新用户资料函数
      await updateUserProfile(
        profile.id,
        formData.name,
        profile.email,
        isAdmin
      )

      setMessage('保存成功！')
      setIsEditing(false)
      
      // 先刷新用户信息以更新AuthContext
      await refreshUser()
      
      // 然后重新加载profile数据
      await loadProfile()
      
    } catch (error: any) {
      console.error('保存资料失败:', error)
      setMessage(error.message || '保存失败，请重试')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!profile) { return }

    setPasswordLoading(true)
    setPasswordMessage('')

    try {
      console.log('=== 开始发送密码重置邮件 ===')
      
      await resetPassword(profile.email)
      
      setPasswordMessage('密码重置邮件已发送，请查收邮件并按照邮件中的指引重置密码')
    } catch (error: any) {
      console.error('发送密码重置邮件失败:', error)
      setPasswordMessage(error.message || '发送重置邮件失败，请重试')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">无法加载用户资料</p>
          <button
            onClick={() => router.push('/')}
            className="bg-law-red-500 text-white px-6 py-2 rounded-lg hover:bg-law-red-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">个人资料</h1>
            <p className="text-gray-600">管理您的个人信息和账户设置</p>
          </div>
        </div>

        {/* 资料卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
            {!isEditing
              ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 transition-colors text-sm font-medium"
                >
                  编辑资料
                </button>
              )
              : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({ name: profile.name, email: profile.email })
                      setMessage('')
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    {saveLoading ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('成功')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* 头像区域 */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-r from-law-red-500 to-law-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-500">{profile.role === 'admin' ? '管理员' : '普通用户'}</p>
              </div>
            </div>

            {/* 表单字段 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={isEditing ? formData.name : profile.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500 focus:border-transparent ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 账户信息 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">账户信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">账户类型</p>
                  <p className="text-medium text-gray-900">
                    {profile.role === 'admin' ? '管理员账户' : '用户账户'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">注册时间</p>
                  <p className="text-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">安全设置</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">修改密码</p>
                <p className="text-sm text-gray-500">点击按钮我们将发送密码重置邮件到您的邮箱</p>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={passwordLoading}
                className="text-law-red-500 hover:text-law-red-600 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {passwordLoading ? '发送中...' : '修改密码'}
              </button>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMessage.includes('成功') || passwordMessage.includes('已发送')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {passwordMessage}
              </div>
            )}

            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-gray-900">双因素认证</p>
                <p className="text-sm text-gray-500">为账户添加额外的安全保护</p>
              </div>
              <button className="text-law-red-500 hover:text-law-red-600 font-medium text-sm">
                设置
              </button>
            </div>
          </div>
        </div>

        {/* 危险操作 */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">危险操作</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">退出登录</p>
                <p className="text-sm text-gray-500">退出当前账户</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 使用认证守卫包装组件
export default withAuth(ProfilePage, { requireAuth: true })
