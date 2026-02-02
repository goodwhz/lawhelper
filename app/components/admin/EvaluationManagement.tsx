'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import type { Evaluation, EvaluationMessage, EvaluationResult } from '@/app/components/tools/niuma-evaluator/types'

interface User {
  id: string
  email: string
  created_at: string
  name?: string
}

export default function EvaluationManagement() {
  const { isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 批量选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 测评详情查看状态
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null)
  const [evaluationMessages, setEvaluationMessages] = useState<EvaluationMessage[]>([])
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

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
      console.log('开始加载测评数据...')

      const [evaluationsRes, usersRes] = await Promise.all([
        supabase.from('niuma_evaluations').select('*').neq('status', 'deleted'),
        supabase.from('user_profiles').select('id, email, name, created_at'),
      ])

      console.log('数据库查询结果:', {
        evaluations: {
          data: evaluationsRes.data,
          error: evaluationsRes.error,
          count: evaluationsRes.data?.length || 0,
        },
        users: {
          data: usersRes.data,
          error: usersRes.error,
          count: usersRes.data?.length || 0,
        },
      })

      if (evaluationsRes.error) {
        console.error('测评查询错误:', evaluationsRes.error)
      } else {
        console.log(`成功加载 ${evaluationsRes.data?.length || 0} 个测评`)
        setEvaluations(evaluationsRes.data || [])
      }

      if (usersRes.error) {
        console.error('用户查询错误:', usersRes.error)
      } else {
        console.log(`成功加载 ${usersRes.data?.length || 0} 个用户`)
        setUsers(usersRes.data || [])
      }
    } catch (error) {
      console.error('加载测评数据失败:', error)
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

  // 查看测评详情
  const viewEvaluationDetail = async (evaluation: Evaluation) => {
    setLoadingDetail(true)
    setViewingEvaluation(evaluation)
    try {
      // 加载测评消息
      const [messagesRes, resultRes] = await Promise.all([
        supabase
          .from('niuma_evaluation_messages')
          .select('*')
          .eq('evaluation_id', evaluation.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('niuma_evaluation_results')
          .select('*')
          .eq('evaluation_id', evaluation.id)
          .single(),
      ])

      if (messagesRes.error) {
        console.error('加载消息失败:', messagesRes.error)
      } else {
        setEvaluationMessages(messagesRes.data || [])
      }

      if (resultRes.error && resultRes.error.code !== 'PGRST116') {
        // PGRST116 表示没有找到结果
        console.error('加载结果失败:', resultRes.error)
      } else {
        setEvaluationResult(resultRes.data || null)
      }
    } catch (error) {
      console.error('查看测评详情失败:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  // 关闭测评详情
  const closeEvaluationDetail = () => {
    setViewingEvaluation(null)
    setEvaluationMessages([])
    setEvaluationResult(null)
  }

  // 删除单个测评
  const deleteEvaluation = async (id: string) => {
    try {
      // 标记为已删除
      await supabase
        .from('niuma_evaluations')
        .update({ status: 'deleted' })
        .eq('id', id)
      loadData()
    } catch (error) {
      console.error('删除测评失败:', error)
    }
  }

  // 批量删除测评
  const batchDeleteEvaluations = async (ids: string[]) => {
    try {
      await supabase
        .from('niuma_evaluations')
        .update({ status: 'deleted' })
        .in('id', ids)
      setSelectedItems([])
      setSelectAll(false)
      loadData()
    } catch (error) {
      console.error('批量删除测评失败:', error)
    }
  }

  // 获取测评消息数量
  const _getMessageCount = (evaluationId: string): number => {
    return evaluationMessages.filter(m => m.evaluation_id === evaluationId).length
  }

  // 过滤和排序数据
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const user = users.find(u => u.id === evaluation.user_id)
      return evaluation.title?.toLowerCase().includes(searchQuery.toLowerCase())
        || user?.email.toLowerCase().includes(searchQuery.toLowerCase())
        || evaluation.version.toLowerCase().includes(searchQuery.toLowerCase())
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Evaluation]
      const bValue = b[sortBy as keyof Evaluation]
      const multiplier = sortOrder === 'asc' ? 1 : -1

      if (aValue === null) { return 1 * multiplier }
      if (bValue === null) { return -1 * multiplier }

      if (aValue < bValue) { return -1 * multiplier }
      if (aValue > bValue) { return 1 * multiplier }
      return 0
    })
  }, [evaluations, users, searchQuery, sortBy, sortOrder])

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
      setSelectedItems(filteredEvaluations.map(item => item.id))
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
        message = `确定要删除选中的 ${itemCount} 个测评吗？此操作将标记为删除，不可撤销！`
        onConfirm = async () => {
          // 先设置 loading 状态
          setConfirmDialog(prev => ({ ...prev, isLoading: true }))
          try {
            await batchDeleteEvaluations(selectedItems)
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
                placeholder="搜索测评标题、用户邮箱或版本..."
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
              已选择 {selectedItems.length} 个测评
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

      {/* 测评列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">测评管理</h3>
            <span className="text-sm text-gray-500">
              共 {filteredEvaluations.length} 个测评
            </span>
          </div>

          <div className="space-y-4">
            {filteredEvaluations.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? '未找到匹配的测评' : '暂无测评记录'}
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

                  {filteredEvaluations.map((evaluation) => {
                    const user = users.find(u => u.id === evaluation.user_id)
                    return (
                      <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(evaluation.id)}
                              onChange={() => toggleItemSelection(evaluation.id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{evaluation.title || '未命名测评'}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  evaluation.version === 'simple'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {evaluation.version === 'simple' ? '简易版' : '正常版'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  evaluation.status === 'active'
                                    ? 'bg-blue-100 text-blue-700'
                                    : evaluation.status === 'archived'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-red-100 text-red-700'
                                }`}>
                                  {evaluation.status === 'active' ? '活跃' : evaluation.status === 'archived' ? '已归档' : '已删除'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>
                                  用户: {user?.email || '未知用户'}
                                </span>
                                <span>
                                  创建时间: {new Date(evaluation.created_at).toLocaleString()}
                                </span>
                                <span>
                                  更新时间: {new Date(evaluation.updated_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => viewEvaluationDetail(evaluation)}
                              className="text-blue-600 hover:text-blue-800"
                              title="查看测评详情"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: '删除测评',
                                  message: `确定要删除测评 "${evaluation.title || '未命名测评'}" 吗？此操作将标记为删除，不可撤销！`,
                                  onConfirm: async () => {
                                    setConfirmDialog(prev => ({ ...prev, isLoading: true }))
                                    try {
                                      await deleteEvaluation(evaluation.id)
                                    } finally {
                                      setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
                                    }
                                  },
                                  type: 'danger',
                                })
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="删除测评"
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

      {/* 测评详情弹窗 */}
      {viewingEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">测评详情</h3>
              <button
                onClick={closeEvaluationDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">测评标题：</span>
                  <span>{viewingEvaluation.title || '未命名测评'}</span>
                </div>
                <div>
                  <span className="font-medium">用户：</span>
                  <span>{users.find(u => u.id === viewingEvaluation.user_id)?.email || '未知用户'}</span>
                </div>
                <div>
                  <span className="font-medium">版本：</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    viewingEvaluation.version === 'simple'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {viewingEvaluation.version === 'simple' ? '简易版' : '正常版'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">状态：</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    viewingEvaluation.status === 'active'
                      ? 'bg-blue-100 text-blue-700'
                      : viewingEvaluation.status === 'archived'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {viewingEvaluation.status === 'active' ? '活跃' : viewingEvaluation.status === 'archived' ? '已归档' : '已删除'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">消息数量：</span>
                  <span>{evaluationMessages.length}</span>
                </div>
                <div>
                  <span className="font-medium">创建时间：</span>
                  <span>{new Date(viewingEvaluation.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* 测评结果 */}
              {evaluationResult && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-900">📊 测评结果</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {evaluationResult.total_score !== null && (
                      <div className="bg-pink-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-pink-600">
                          {evaluationResult.total_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">综合评分</div>
                      </div>
                    )}
                    {evaluationResult.salary_score !== null && (
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {evaluationResult.salary_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">薪资回报</div>
                      </div>
                    )}
                    {evaluationResult.workload_score !== null && (
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-purple-600">
                          {evaluationResult.workload_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">工作强度</div>
                      </div>
                    )}
                    {evaluationResult.growth_score !== null && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600">
                          {evaluationResult.growth_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">成长空间</div>
                      </div>
                    )}
                    {evaluationResult.environment_score !== null && (
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-yellow-600">
                          {evaluationResult.environment_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">工作环境</div>
                      </div>
                    )}
                    {evaluationResult.atmosphere_score !== null && (
                      <div className="bg-indigo-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-indigo-600">
                          {evaluationResult.atmosphere_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">团队氛围</div>
                      </div>
                    )}
                    {evaluationResult.mental_health_score !== null && (
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-red-600">
                          {evaluationResult.mental_health_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">心理健康</div>
                      </div>
                    )}
                  </div>
                  {evaluationResult.evaluation_summary && (
                    <div className="mt-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-1">测评总结</h5>
                      <p className="text-sm text-gray-700">{evaluationResult.evaluation_summary}</p>
                    </div>
                  )}
                  {evaluationResult.suggestions && (
                    <div className="mt-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-1">改进建议</h5>
                      <p className="text-sm text-gray-700">{evaluationResult.suggestions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingDetail
                ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">加载消息中...</p>
                  </div>
                )
                : evaluationMessages.length === 0
                  ? (
                    <div className="text-center py-8 text-gray-500">
                      暂无消息记录
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      {evaluationMessages.map(message => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content || '无内容'}
                            </div>
                            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeEvaluationDetail}
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
