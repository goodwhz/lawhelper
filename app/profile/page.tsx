'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { withAuth } from '@/app/components/auth-guard'
import { signOut, getCurrentUser, updateUserProfile, getUserProfile, resetPassword } from '@/lib/auth'
import Navigation from '@/app/components/navigation'

interface UserProfile {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

function ProfilePage() {
  const { refreshUser, forceUpdate } = useAuth()
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

  // 注销账户相关状态
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCredentials, setDeleteCredentials] = useState({
    email: '',
    password: '',
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')

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

      // 构建更新对象，只包含需要更新的字段
      const updates: any = {}

      // 只有当名称发生变化时才包含name字段
      if (formData.name.trim() !== profile.name) {
        updates.name = formData.name.trim()
      }

      // 如果没有任何字段需要更新，直接返回成功
      if (Object.keys(updates).length === 0) {
        setMessage('没有需要更新的内容')
        setIsEditing(false)
        return
      }

      console.log('更新内容:', updates)

      // 使用新的更新用户资料函数 - 修正参数传递
      const result = await updateUserProfile(profile.id, updates)

      if (!result.success) {
        throw new Error(result.error || '保存失败')
      }

      setMessage('保存成功！')
      setIsEditing(false)

      // 清除所有相关的缓存
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('userCache')
        if (profile) {
          sessionStorage.removeItem(`profile_${profile.id}`)
        }
      }

      // 先强制刷新用户信息以更新AuthContext
      await refreshUser(true)

      // 然后重新加载profile数据
      await loadProfile()

      // 强制更新所有使用useAuth的组件
      forceUpdate()

      // 强制重新渲染Navigation组件
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'))
      }, 100)
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

  // 打开注销账户模态框
  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true)
    setDeleteCredentials({
      email: profile.email,
      password: '',
    })
    setDeleteError('')
    setDeleteMessage('')
  }

  // 关闭注销账户模态框
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteCredentials({ email: '', password: '' })
    setDeleteError('')
    setDeleteMessage('')
  }

  // 处理注销账户表单输入
  const handleDeleteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDeleteCredentials(prev => ({ ...prev, [name]: value }))
    setDeleteError('')
    setDeleteMessage('')
  }

  // 确认注销账户
  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证输入
    if (!deleteCredentials.email || !deleteCredentials.password) {
      setDeleteError('请输入完整的邮箱和密码')
      return
    }

    if (deleteCredentials.email !== profile.email) {
      setDeleteError('输入的邮箱与当前账户不匹配')
      return
    }

    if (deleteCredentials.password.length < 1) {
      setDeleteError('请输入密码进行验证')
      return
    }

    setDeleteLoading(true)
    setDeleteError('')
    setDeleteMessage('')

    try {
      console.log('开始注销账户流程...')

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: deleteCredentials.email,
          password: deleteCredentials.password,
        }),
      })

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('服务器返回非JSON响应:', contentType)
        setDeleteError('服务器响应异常，请稍后重试')
        return
      }

      // 安全地解析JSON
      let result
      try {
        const responseText = await response.text()
        console.log('服务器响应:', responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        setDeleteError('服务器返回的数据格式异常，请联系管理员')
        return
      }

      if (response.ok && result.success) {
        setDeleteMessage('账户注销成功！正在跳转到首页...')

        // 显示成功消息2秒后进行真正的注销
        setTimeout(async () => {
          try {
            // 使用AuthContext的signOut方法清除所有状态
            await signOut()

            console.log('用户已成功注销，所有状态已清除')

            // 强制刷新页面以清除所有状态
            window.location.href = '/'
          } catch (signOutError) {
            console.error('清除客户端会话失败:', signOutError)
            // 即使清除会话失败，也跳转到首页
            setShowDeleteModal(false)
            router.push('/')
          }
        }, 2000)
      } else {
        setDeleteError(result.error || '注销账户失败，请重试')
      }
    } catch (error: any) {
      console.error('注销账户失败:', error)
      setDeleteError(error.message || '注销账户失败，请稍后重试')
    } finally {
      setDeleteLoading(false)
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

            <div className="flex justify-between items-center py-3 border-t border-red-100">
              <div>
                <p className="font-medium text-gray-900">注销账户</p>
                <p className="text-sm text-gray-500">永久删除账户和所有相关数据</p>
              </div>
              <button
                onClick={handleOpenDeleteModal}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                注销账户
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 注销账户确认模态框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* 关闭按钮 */}
            <button
              onClick={handleCloseDeleteModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={deleteLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 头部 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3.054L12.252 4.486A2.25 2.25 0 0011.544 3H4.456a2.25 2.25 0 00-2.062 1.456L4.026 15.946C3.492 17.333 4.456 19 6 19h12c1.544 0 2.506-1.667 1.972-3.054L13.544 4.486A2.25 2.25 0 0011.544 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">注销账户</h2>
              <p className="text-gray-600 text-sm">
                此操作将永久删除您的账户和所有相关数据
              </p>
            </div>

            {/* 警告信息 */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
              <p className="font-medium mb-2">⚠️ 警告：此操作不可逆转</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>将删除您的个人资料和所有聊天记录</li>
                <li>将删除您的账户信息，无法恢复</li>
                <li>需要输入当前账户的邮箱和密码进行验证</li>
              </ul>
            </div>

            {/* 表单 */}
            <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  name="email"
                  value={deleteCredentials.email}
                  onChange={handleDeleteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入邮箱地址"
                  disabled={deleteLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  name="password"
                  value={deleteCredentials.password}
                  onChange={handleDeleteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入密码进行验证"
                  disabled={deleteLoading}
                  required
                />
              </div>

              {/* 错误信息 */}
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              {/* 成功信息 */}
              {deleteMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                  {deleteMessage}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {deleteLoading
                    ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        注销中...
                      </span>
                    )
                    : (
                      '确认注销'
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// 使用认证守卫包装组件
export default withAuth(ProfilePage, { requireAuth: true })
