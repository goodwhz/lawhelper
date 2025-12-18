'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

interface SyncStats {
  total_users: number
  synced_users: number
  missing_users: number
  email_mismatch_users: number
  outdated_users: number
  login_outdated_users: number
  sync_percentage: number
}

interface SyncStatusUser {
  id: string
  email: string
  name: string | null
  role: string
  auth_created: string
  profile_created: string | null
  auth_updated: string
  profile_updated: string | null
  last_sign_in: string | null
  last_login: string | null
  sync_status: string
}

interface SyncData {
  stats: SyncStats
  users: SyncStatusUser[]
}

// 创建Supabase客户端实例
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const SyncMonitor: React.FC = () => {
  const { user: _currentUser, isAdmin } = useAuth()
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // 获取同步状态
  const fetchSyncStatus = useCallback(async () => {
    try {
      setLoading(true)

      if (!isAdmin) {
        console.warn('用户不是管理员，无法访问同步监控')
        return
      }

      // 获取当前会话的访问令牌
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.warn('无法获取访问令牌')
        return
      }

      const response = await fetch('/api/admin/sync/status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('获取同步状态失败')
      }

      const result = await response.json()
      if (result.success) {
        setSyncData(result.data)
        setLastSyncTime(new Date().toLocaleString('zh-CN'))
      }
    } catch (error) {
      console.error('获取同步状态失败:', error)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // 强制同步
  const forceSync = async () => {
    try {
      setSyncing(true)

      // 获取当前会话的访问令牌
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.warn('无法获取访问令牌')
        return
      }

      const response = await fetch('/api/admin/sync/force', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '强制同步失败')
      }

      const result = await response.json()
      if (result.success) {
        console.log('✅ 强制同步成功:', result.message)
        // 重新获取同步状态
        await fetchSyncStatus()
      }
    } catch (error) {
      console.error('强制同步失败:', error)
      console.error(`强制同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setSyncing(false)
    }
  }

  // 获取同步状态描述
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'synced':
        return { text: '✅ 已同步', color: 'text-green-600', bg: 'bg-green-50' }
      case 'missing':
        return { text: '❌ 缺失档案', color: 'text-red-600', bg: 'bg-red-50' }
      case 'email_mismatch':
        return { text: '⚠️ 邮箱不一致', color: 'text-yellow-600', bg: 'bg-yellow-50' }
      case 'profile_outdated':
        return { text: '⚠️ 档案过期', color: 'text-orange-600', bg: 'bg-orange-50' }
      case 'login_outdated':
        return { text: '⚠️ 登录时间不同步', color: 'text-blue-600', bg: 'bg-blue-50' }
      default:
        return { text: '❓ 未知状态', color: 'text-gray-600', bg: 'bg-gray-50' }
    }
  }

  // 获取同步进度条颜色
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 95) { return 'bg-green-500' }
    if (percentage >= 80) { return 'bg-yellow-500' }
    if (percentage >= 60) { return 'bg-orange-500' }
    return 'bg-red-500'
  }

  useEffect(() => {
    if (isAdmin) {
      fetchSyncStatus()

      // 每30秒自动刷新一次
      const interval = setInterval(fetchSyncStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, fetchSyncStatus])

  // 检查用户权限
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">权限不足</div>
          <div className="text-gray-500">您需要管理员权限才能访问同步监控</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!syncData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">获取同步状态失败</div>
          <button
            onClick={fetchSyncStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const { stats, users } = syncData

  return (
    <div className="space-y-6">
      {/* 同步统计概览 - 移动端优化 */}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">用户数据同步状态</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {lastSyncTime && (
              <span className="text-sm text-gray-500">
                最后更新: {lastSyncTime}
              </span>
            )}
            <div className="flex gap-2">
              <button
                onClick={fetchSyncStatus}
                className="mobile-ripple px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 touch-target font-medium"
              >
                刷新
              </button>
              <button
                onClick={forceSync}
                disabled={syncing}
                className="mobile-ripple px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 touch-target font-medium"
              >
                {syncing ? '同步中...' : '强制同步'}
              </button>
            </div>
          </div>
        </div>

        {/* 同步进度条 */}
        <div className="mb-4 lg:mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>同步进度</span>
            <span>{stats.sync_percentage}% ({stats.synced_users}/{stats.total_users})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(stats.sync_percentage)}`}
              style={{ width: `${stats.sync_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* 同步统计卡片 - 移动端优化 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
          <div className="bg-green-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.synced_users}</div>
            <div className="text-xs lg:text-sm text-green-800">已同步</div>
          </div>
          <div className="bg-red-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-red-600">{stats.missing_users}</div>
            <div className="text-xs lg:text-sm text-red-800">缺失档案</div>
          </div>
          <div className="bg-yellow-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-yellow-600">{stats.email_mismatch_users}</div>
            <div className="text-xs lg:text-sm text-yellow-800">邮箱不一致</div>
          </div>
          <div className="bg-orange-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-orange-600">{stats.outdated_users}</div>
            <div className="text-xs lg:text-sm text-orange-800">档案过期</div>
          </div>
          <div className="bg-blue-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">{stats.login_outdated_users}</div>
            <div className="text-xs lg:text-sm text-blue-800">登录时间不同步</div>
          </div>
          <div className="bg-gray-50 p-3 lg:p-3 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-gray-600">{stats.total_users}</div>
            <div className="text-xs lg:text-sm text-gray-800">总用户数</div>
          </div>
        </div>
      </div>

      {/* 用户同步详情 - 移动端优化 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">用户同步详情</h3>
        </div>

        {/* 桌面端表格视图 */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    认证创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    档案创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    同步状态
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const statusInfo = getStatusDescription(user.sync_status)

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || '未设置姓名'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.auth_created).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.profile_created
                          ? new Date(user.profile_created).toLocaleDateString('zh-CN')
                          : '未创建'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in
                          ? new Date(user.last_sign_in).toLocaleDateString('zh-CN')
                          : '从未登录'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 移动端卡片视图 */}
        <div className="lg:hidden p-3">
          <div className="space-y-3">
            {users.map((user) => {
              const statusInfo = getStatusDescription(user.sync_status)

              return (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  {/* 用户信息头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {user.name || '未设置姓名'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">认证创建:</span>
                      <span className="text-gray-900">{new Date(user.auth_created).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">档案创建:</span>
                      <span className="text-gray-900">
                        {user.profile_created
                          ? new Date(user.profile_created).toLocaleDateString('zh-CN')
                          : '未创建'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">最后登录:</span>
                      <span className="text-gray-900">
                        {user.last_sign_in
                          ? new Date(user.last_sign_in).toLocaleDateString('zh-CN')
                          : '从未登录'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 同步说明 - 移动端优化 */}
      <div className="bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
        <h4 className="text-blue-800 font-medium mb-2 text-sm lg:text-base">同步机制说明</h4>
        <ul className="text-blue-700 text-sm space-y-1 lg:text-sm">
          <li>• 数据库触发器自动处理新用户注册、用户信息更新和登录事件</li>
          <li>• 实时监控用户认证数据与档案数据的同步状态</li>
          <li>• 支持手动强制同步以修复不一致的数据</li>
          <li>• 同步状态每30秒自动刷新一次</li>
        </ul>
      </div>
    </div>
  )
}

export default SyncMonitor
