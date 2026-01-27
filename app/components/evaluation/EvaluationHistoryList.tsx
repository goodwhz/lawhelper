'use client'

import React, { useState, useEffect } from 'react'
import type { EvaluationHistory, DimensionTrendData } from '@/types/evaluation'
import EvaluationTrendChart from './EvaluationTrendChart'

interface EvaluationHistoryListProps {
  userToken: string
  onClose: () => void
}

const EvaluationHistoryList: React.FC<EvaluationHistoryListProps> = ({ userToken, onClose }) => {
  const [evaluations, setEvaluations] = useState<EvaluationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationHistory | null>(null)
  const [showTrend, setShowTrend] = useState(false)

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluations', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取测评记录失败')
      }

      setEvaluations(result.data || [])
      setError(null)
    } catch (err) {
      console.error('获取测评记录失败:', err)
      setError(err instanceof Error ? err.message : '获取测评记录失败')
    } finally {
      setLoading(false)
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const deleteEvaluation = async (id: string) => {
    setShowDeleteConfirm(null)

    try {
      setDeletingId(id)
      const response = await fetch(`/api/evaluations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 刷新列表
      await fetchEvaluations()
      if (selectedEvaluation?.id === id) {
        setSelectedEvaluation(null)
      }
    } catch (err) {
      console.error('删除测评记录失败:', err)
      throw err
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchEvaluations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken])

  const getScoreColor = (score: number) => {
    if (score >= 80) { return 'text-green-600 bg-green-50 border-green-200' }
    if (score >= 60) { return 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) { return '优秀' }
    if (score >= 60) { return '良好' }
    return '需改善'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const prepareTrendData = (): DimensionTrendData[] => {
    return evaluations
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(e => ({
        date: e.created_at,
        total_score: e.total_score,
        薪资回报: e.salary_score,
        工作强度: e.workload_score,
        成长空间: e.growth_score,
        工作环境: e.environment_score,
        团队氛围: e.atmosphere_score,
        心理健康: e.mental_health_score,
      }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchEvaluations}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 mb-2">暂无测评记录</p>
          <p className="text-gray-400 text-sm">完成一次测评后，记录将显示在这里</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            开始测评
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">测评历史</h2>
            <p className="text-sm text-gray-500 mt-1">共 {evaluations.length} 条记录</p>
          </div>
          <div className="flex items-center space-x-2">
            {evaluations.length >= 2 && (
              <button
                onClick={() => setShowTrend(!showTrend)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showTrend
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showTrend ? '查看列表' : '查看趋势'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {showTrend
          ? (
            <EvaluationTrendChart data={prepareTrendData()} />
          )
          : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {evaluations.map(evaluation => (
                <div
                  key={evaluation.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEvaluation(evaluation)}
                >
                  {/* 评分头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{evaluation.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(evaluation.created_at)}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(evaluation.total_score)}`}
                    >
                      {evaluation.total_score.toFixed(1)}分
                    </div>
                  </div>

                  {/* 维度评分 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {evaluation.salary_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">薪资回报</span>
                        <span className="font-medium">{evaluation.salary_score.toFixed(1)}</span>
                      </div>
                    )}
                    {evaluation.workload_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">工作强度</span>
                        <span className="font-medium">{evaluation.workload_score.toFixed(1)}</span>
                      </div>
                    )}
                    {evaluation.growth_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">成长空间</span>
                        <span className="font-medium">{evaluation.growth_score.toFixed(1)}</span>
                      </div>
                    )}
                    {evaluation.environment_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">工作环境</span>
                        <span className="font-medium">{evaluation.environment_score.toFixed(1)}</span>
                      </div>
                    )}
                    {evaluation.atmosphere_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">团队氛围</span>
                        <span className="font-medium">{evaluation.atmosphere_score.toFixed(1)}</span>
                      </div>
                    )}
                    {evaluation.mental_health_score !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">心理健康</span>
                        <span className="font-medium">{evaluation.mental_health_score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* 测评总结 */}
                  {evaluation.evaluation_summary && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {evaluation.evaluation_summary}
                      </p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvaluation(evaluation)
                      }}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(evaluation.id)
                      }}
                      disabled={deletingId === evaluation.id}
                      className={`text-sm ${
                        deletingId === evaluation.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700'
                      } font-medium`}
                    >
                      {deletingId === evaluation.id ? '删除中...' : '删除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* 详情弹窗 */}
      {selectedEvaluation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvaluation(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* 弹窗头部 */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{selectedEvaluation.title}</h3>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(selectedEvaluation.created_at)}
              </p>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
              {/* 综合评分 */}
              <div className="text-center mb-6">
                <div
                  className={`inline-block px-6 py-3 rounded-xl border-2 ${getScoreColor(selectedEvaluation.total_score)}`}
                >
                  <div className="text-4xl font-bold">{selectedEvaluation.total_score.toFixed(1)}</div>
                  <div className="text-sm font-medium mt-1">{getScoreLabel(selectedEvaluation.total_score)}</div>
                </div>
              </div>

              {/* 维度评分 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {selectedEvaluation.salary_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">薪资回报</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.salary_score.toFixed(1)}
                    </div>
                  </div>
                )}
                {selectedEvaluation.workload_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">工作强度</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.workload_score.toFixed(1)}
                    </div>
                  </div>
                )}
                {selectedEvaluation.growth_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">成长空间</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.growth_score.toFixed(1)}
                    </div>
                  </div>
                )}
                {selectedEvaluation.environment_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">工作环境</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.environment_score.toFixed(1)}
                    </div>
                  </div>
                )}
                {selectedEvaluation.atmosphere_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">团队氛围</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.atmosphere_score.toFixed(1)}
                    </div>
                  </div>
                )}
                {selectedEvaluation.mental_health_score !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">心理健康</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedEvaluation.mental_health_score.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {/* 测评总结 */}
              {selectedEvaluation.evaluation_summary && (
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">测评总结</h4>
                  <p className="text-gray-700">{selectedEvaluation.evaluation_summary}</p>
                </div>
              )}

              {/* 建议列表 */}
              {selectedEvaluation.suggestions && selectedEvaluation.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">改善建议</h4>
                  <ul className="space-y-2">
                    {selectedEvaluation.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这条测评记录吗？此操作不可恢复。</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const idToDelete = showDeleteConfirm
                  deleteEvaluation(idToDelete).catch(() => {
                    setShowDeleteConfirm(idToDelete)
                  })
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluationHistoryList
