'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'

interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  user_email?: string
}

interface User {
  id: string
  email: string
  created_at: string
  user_profiles?: {
    full_name: string
    role: string
  }
}

interface Message {
  id: string
  conversation_id: string
  role: string
  content: string
  created_at: string
}

export default function ConversationManagement() {
  const { isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 批量选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 对话详情查看状态
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

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

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('开始加载对话数据...')

      const [conversationsRes, usersRes] = await Promise.all([
        // 从 conversations 表读取数据
        supabase.from('conversations').select('*'),
        // 从 user_profiles 表读取用户数据
        supabase.from('user_profiles').select('*'),
      ])

      console.log('数据库查询结果:', {
        conversations: {
          data: conversationsRes.data,
          error: conversationsRes.error,
          count: conversationsRes.data?.length || 0,
        },
        users: {
          data: usersRes.data,
          error: usersRes.error,
          count: usersRes.data?.length || 0,
        },
      })

      if (conversationsRes.error) {
        console.error('对话查询错误:', conversationsRes.error)
      } else {
        console.log(`成功加载 ${conversationsRes.data?.length || 0} 个对话`)

        // 为每个对话获取消息数量
        const conversationsWithCount = await Promise.all(
          (conversationsRes.data || []).map(async (conv) => {
            const { count, error } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)

            return {
              ...conv,
              message_count: error ? 0 : (count || 0),
            }
          }),
        )

        setConversations(conversationsWithCount)
      }

      if (usersRes.error) {
        console.error('用户查询错误:', usersRes.error)
      } else {
        console.log(`成功加载 ${usersRes.data?.length || 0} 个用户`)
        setUsers(usersRes.data || [])
      }
    } catch (error) {
      console.error('加载对话数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 执行搜索
  const handleSearch = () => {
    setSearchQuery(searchTerm)
  }

  // 处理回车键搜索
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 查看对话详情
  const viewConversationDetail = async (conversation: Conversation) => {
    setLoadingMessages(true)
    setViewingConversation(conversation)
    try {
      // 加载对话消息
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('加载消息失败:', error)
      } else {
        setConversationMessages(messages || [])
      }
    } catch (error) {
      console.error('查看对话详情失败:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  // 关闭对话详情
  const closeConversationDetail = () => {
    setViewingConversation(null)
    setConversationMessages([])
  }

  // 删除单个对话
  const deleteConversation = async (id: string) => {
    try {
      // 先删除关联的消息
      await supabase.from('messages').delete().eq('conversation_id', id)
      // 再删除对话
      await supabase.from('conversations').delete().eq('id', id)
      loadData()
    } catch (error) {
      console.error('删除对话失败:', error)
    }
  }

  // 批量删除对话
  const batchDeleteConversations = async (ids: string[]) => {
    try {
      // 批量删除关联的消息
      await supabase.from('messages').delete().in('conversation_id', ids)
      // 批量删除对话
      await supabase.from('conversations').delete().in('id', ids)
      setSelectedItems([])
      setSelectAll(false)
      loadData()
    } catch (error) {
      console.error('批量删除对话失败:', error)
    }
  }

  // 过滤和排序数据
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const user = users.find(u => u.id === conv.user_id)
      return conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
        || user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Conversation]
      const bValue = b[sortBy as keyof Conversation]
      const multiplier = sortOrder === 'asc' ? 1 : -1

      if (aValue === null) { return 1 * multiplier }
      if (bValue === null) { return -1 * multiplier }

      if (aValue < bValue) { return -1 * multiplier }
      if (aValue > bValue) { return 1 * multiplier }
      return 0
    })
  }, [conversations, users, searchQuery, sortBy, sortOrder])

  // 选择/取消选择项目
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id],
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredConversations.map(item => item.id))
    }
    setSelectAll(!selectAll)
  }

  // 批量操作
  const handleBatchOperation = (operation: string) => {
    const itemCount = selectedItems.length
    let message = ''
    let onConfirm = () => {}

    switch (operation) {
      case 'delete':
        message = `确定要删除选中的 ${itemCount} 个对话吗？此操作将同时删除所有关联的消息，不可撤销！`
        onConfirm = async () => {
          setConfirmDialog(prev => ({ ...prev, isLoading: true }))
          try {
            await batchDeleteConversations(selectedItems)
          } finally {
            setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
          }
        }
        break
    }

    setConfirmDialog({
      isOpen: true,
      title: '批量操作确认',
      message,
      onConfirm,
      type: operation === 'delete' ? 'danger' : 'warning',
      isLoading: false,
    })
  }

  // 检查权限
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索对话标题或用户邮箱..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="mobile-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors touch-target font-medium"
          >
            搜索
          </button>
        </div>

        {/* 排序选项 */}
        <div className="mt-3">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              setSortBy(sortBy)
              setSortOrder(sortOrder as 'asc' | 'desc')
            }}
            className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
          >
            <option value="created_at-desc">创建时间 ↓</option>
            <option value="created_at-asc">创建时间 ↑</option>
            <option value="updated_at-desc">更新时间 ↓</option>
            <option value="updated_at-asc">更新时间 ↑</option>
            <option value="title-asc">标题 A-Z</option>
            <option value="title-desc">标题 Z-A</option>
          </select>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-blue-800 mobile-text-base font-medium">
              已选择 {selectedItems.length} 个对话
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchOperation('delete')}
                className="mobile-ripple px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors touch-target font-medium"
              >
                批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 对话列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">对话记录管理</h3>
            <span className="text-sm text-gray-500">
              共 {filteredConversations.length} 个对话
            </span>
          </div>

          <div className="space-y-4">
            {filteredConversations.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? '未找到匹配的对话记录' : '暂无对话记录'}
                </div>
              )
              : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">全选</span>
                    </div>
                  </div>

                  {filteredConversations.map((conv) => {
                    const user = users.find(u => u.id === conv.user_id)
                    return (
                      <div key={conv.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(conv.id)}
                              onChange={() => toggleItemSelection(conv.id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{conv.title || '未命名对话'}</h4>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>
                                  用户: {user?.email || '未知用户'}
                                </span>
                                <span>
                                  消息数: {conv.message_count || 0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  创建时间: {new Date(conv.created_at).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  更新时间: {new Date(conv.updated_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => viewConversationDetail(conv)}
                              className="text-blue-600 hover:text-blue-800"
                              title="查看对话详情"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: '删除对话',
                                  message: `确定要删除对话 "${conv.title || '未命名对话'}" 吗？此操作将同时删除所有关联的消息，不可撤销！`,
                                  onConfirm: async () => {
                                    setConfirmDialog(prev => ({ ...prev, isLoading: true }))
                                    try {
                                      await deleteConversation(conv.id)
                                    } finally {
                                      setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
                                    }
                                  },
                                  type: 'danger',
                                })
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="删除对话"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
          </div>
        </div>
      </div>

      {/* 对话详情弹窗 */}
      {viewingConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">对话详情</h3>
              <button
                onClick={closeConversationDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">对话标题：</span>
                  <span>{viewingConversation.title || '未命名对话'}</span>
                </div>
                <div>
                  <span className="font-medium">用户：</span>
                  <span>{users.find(u => u.id === viewingConversation.user_id)?.email || '未知用户'}</span>
                </div>
                <div>
                  <span className="font-medium">消息数量：</span>
                  <span>{viewingConversation.message_count || 0}</span>
                </div>
                <div>
                  <span className="font-medium">创建时间：</span>
                  <span>{new Date(viewingConversation.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingMessages
                ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">加载消息中...</p>
                  </div>
                )
                : conversationMessages.length === 0
                  ? (
                    <div className="text-center py-8 text-gray-500">
                      暂无消息记录
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      {conversationMessages.map(message => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <div className="text-sm">
                              {message.content || '无内容'}
                            </div>
                            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeConversationDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                关闭
              </button>
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
