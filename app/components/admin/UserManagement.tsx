'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  last_login_at: string | null
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth()

  // 获取当前用户 token 的辅助函数
  const getUserToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('获取 token 失败:', error)
      return null
    }
  }

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // 编辑状态
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user')

  // 批量选择
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title?: string
    message: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    isLoading: false,
  })

  const limit = 20

  // 执行搜索
  const handleSearch = () => {
    setSearchQuery(search)
    setCurrentPage(1)
  }

  // 处理回车键搜索
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)

      // 检查用户是否为管理员
      if (!isAdmin) {
        console.warn('用户不是管理员，无法获取用户列表')
        setLoading(false)
        return
      }

      const token = await getUserToken()

      if (!token) {
        console.error('未找到用户token，用户可能未登录')
        console.log('可能的解决方案：')
        console.log('1. 重新登录用户')
        console.log('2. 检查浏览器控制台的详细认证信息')
        console.log('3. 访问 /test-auth 页面进行调试')
        setLoading(false)
        // 显示用户友好的错误信息
        console.error('无法获取用户认证信息，请重新登录或访问 /test-auth 页面进行调试')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter && { role: roleFilter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API响应错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`获取用户列表失败: ${response.status} ${response.statusText}`)
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotalUsers(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // 更新用户信息
  const updateUser = async (userId: string) => {
    try {
      const token = await getUserToken()
      if (!token) { return }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          name: editName,
          role: editRole,
        }),
      })

      if (!response.ok) {
        throw new Error('更新用户失败')
      }

      const result = await response.json()
      if (result.success) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, name: editName, role: editRole } : u,
        ))
        setEditingUser(null)
      }
    } catch (error) {
      console.error('更新用户失败:', error)
    }
  }

  // 删除单个用户
  const deleteUser = async (userId: string) => {
    try {
      const token = await getUserToken()
      if (!token) { return }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除用户失败')
      }

      const result = await response.json()
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setTotalUsers(prev => prev - 1)
        // 显示成功消息
        console.log('✅ 用户删除成功:', result.message)
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      console.error(`删除用户失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 批量操作用户
  const batchOperateUsers = async (action: 'updateRole' | 'delete', role?: 'user' | 'admin') => {
    try {
      const token = await getUserToken()
      if (!token) { return }

      const response = await fetch('/api/admin/users/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers,
          ...(role && { role }),
        }),
      })

      if (!response.ok) {
        throw new Error('批量操作失败')
      }

      await fetchUsers()
      setSelectedUsers([])
      setSelectAll(false)
    } catch (error) {
      console.error('批量操作失败:', error)
    }
  }

  // 开始编辑用户
  const startEdit = (user: User) => {
    setEditingUser(user.id)
    setEditName(user.name || '')
    setEditRole(user.role)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingUser(null)
    setEditName('')
    setEditRole('user')
  }

  // 选择/取消选择用户
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
    setSelectAll(!selectAll)
  }

  useEffect(() => {
    // 只有管理员或有用户时才获取数据
    if (isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, roleFilter, sortBy, sortOrder, isAdmin])

  useEffect(() => {
    setSelectAll(selectedUsers.length === users.length && users.length > 0)
  }, [selectedUsers, users])

  // 检查用户权限
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">权限不足</div>
          <div className="text-gray-500">您需要管理员权限才能访问此页面</div>
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

  return (
    <div className="space-y-6">
      {/* 搜索和过滤 - 移动端优化 */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="space-y-3">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索用户姓名或邮箱..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
            />
            <button
              onClick={handleSearch}
              className="mobile-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors touch-target font-medium"
            >
              查找
            </button>
          </div>

          {/* 过滤器 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="">所有角色</option>
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setSortBy(sortBy)
                setSortOrder(sortOrder as 'asc' | 'desc')
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="created_at-desc">注册时间 ↓</option>
              <option value="created_at-asc">注册时间 ↑</option>
              <option value="last_login_at-desc">最后登录 ↓</option>
              <option value="last_login_at-asc">最后登录 ↑</option>
              <option value="name-asc">姓名 A-Z</option>
              <option value="name-desc">姓名 Z-A</option>
            </select>
            <div className="hidden lg:block"></div> {/* 占位元素保持布局 */}
          </div>
        </div>
      </div>

      {/* 批量操作 - 移动端优化 */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-blue-800 mobile-text-base font-medium">
              已选择 {selectedUsers.length} 个用户
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setConfirmDialog({
                      isOpen: true,
                      title: '批量更新角色',
                      message: `确定要将选中的 ${selectedUsers.length} 个用户的角色更新为"${e.target.value === 'admin' ? '管理员' : '普通用户'}"吗？`,
                      onConfirm: () => batchOperateUsers('updateRole', e.target.value as 'user' | 'admin'),
                      type: 'warning',
                    })
                    e.target.value = ''
                  }
                }}
                className="px-3 py-2 text-base mobile-text-base border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
              >
                <option value="">批量操作...</option>
                <option value="admin">设为管理员</option>
                <option value="user">设为普通用户</option>
              </select>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: '批量删除用户',
                    message: `确定要删除选中的 ${selectedUsers.length} 个用户吗？此操作不可撤销！`,
                    onConfirm: () => batchOperateUsers('delete'),
                    type: 'danger',
                  })
                }}
                className="mobile-ripple px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors touch-target font-medium"
              >
                批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户列表 - 响应式设计 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* 桌面端表格视图 */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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
                      {editingUser === user.id
                        ? (
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                            className="text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        )
                        : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : '从未登录'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingUser === user.id
                        ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1"
                              placeholder="用户姓名"
                            />
                            <button
                              onClick={() => updateUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              取消
                            </button>
                          </div>
                        )
                        : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              编辑
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: '删除用户',
                                    message: `确定要删除用户 "${user.name || user.email}" 吗？此操作不可撤销！`,
                                    onConfirm: () => deleteUser(user.id),
                                    type: 'danger',
                                  })
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            )}
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 移动端卡片视图 */}
        <div className="lg:hidden">
          <div className="p-3">
            {/* 全选按钮 */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">全选用户</span>
              </label>
            </div>

            {/* 用户卡片列表 */}
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  {/* 用户信息头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name || '未设置姓名'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* 角色标签 */}
                    {editingUser === user.id
                      ? (
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                          className="text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      )
                      : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      )}
                  </div>

                  {/* 编辑模式 - 姓名输入 */}
                  {editingUser === user.id && (
                    <div className="mb-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="用户姓名"
                      />
                    </div>
                  )}

                  {/* 时间信息 */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">注册时间:</span>
                      <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">最后登录:</span>
                      <span className="text-gray-900">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : '从未登录'
                        }
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {editingUser === user.id
                      ? (
                        <>
                          <button
                            onClick={() => updateUser(user.id)}
                            className="mobile-ripple flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors touch-target font-medium"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="mobile-ripple flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors touch-target font-medium"
                          >
                            取消
                          </button>
                        </>
                      )
                      : (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="mobile-ripple flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors touch-target font-medium"
                          >
                            编辑
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: '删除用户',
                                  message: `确定要删除用户 "${user.name || user.email}" 吗？此操作不可撤销！`,
                                  onConfirm: () => deleteUser(user.id),
                                  type: 'danger',
                                })
                              }}
                              className="mobile-ripple flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors touch-target font-medium"
                            >
                              删除
                            </button>
                          )}
                        </>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 分页 - 移动端优化 */}
      {totalPages > 1 && (
        <div className="bg-white px-3 lg:px-4 py-3 lg:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200">
          {/* 移动端：简单分页 */}
          <div className="flex sm:hidden justify-between items-center">
            <div className="text-sm text-gray-600 mobile-text-base">
              第 {currentPage} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="mobile-ripple px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="mobile-ripple px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                下一页
              </button>
            </div>
          </div>

          {/* 桌面端：完整分页 */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示第 <span className="font-medium">{(currentPage - 1) * limit + 1}</span> 到{' '}
                <span className="font-medium">{Math.min(currentPage * limit, totalUsers)}</span> 条，
                共 <span className="font-medium">{totalUsers}</span> 条记录
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
        type={confirmDialog.type}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  )
}

export default UserManagement
