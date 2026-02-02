'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { safeGetUser } from '@/lib/authUtils'
import { useNiuMaSupabaseChat } from './hooks/useNiuMaSupabaseChat'
import NiuMaWelcomeScreen from './NiuMaWelcomeScreen'
import NiuMaMessageBubble from './NiuMaMessageBubble'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import type { Evaluation, EvaluationVersion } from './types'

/**
 * 牛马测评仪 - 集成聊天组件
 * 参考智能核心的布局设计
 */
const IntegratedNiuMaChat: React.FC = () => {
  // 用户信息
  const [userId, setUserId] = useState<string | null>(null)
  const [_isLoggedIn, setIsLoggedIn] = useState(false)

  // 状态管理
  const [showWelcome, setShowWelcome] = useState(true)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<EvaluationVersion | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    evaluationId: string | null
  }>({ isOpen: false, evaluationId: null })
  const [deleteAllDialog, setDeleteAllDialog] = useState({
    isOpen: false,
  })

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const streamAbortController = useRef<AbortController | null>(null)

  // Hook
  const chatHook = useNiuMaSupabaseChat(userId)

  // 获取用户信息
  useEffect(() => {
    const getUser = async () => {
      const result = await safeGetUser()
      if (result.user) {
        setUserId(result.user.id)
        setIsLoggedIn(true)
        await chatHook.loadEvaluations()
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUserId(session.user.id)
          setIsLoggedIn(true)
          await chatHook.loadEvaluations()
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null)
        setIsLoggedIn(false)
        setShowWelcome(true)
        chatHook.setCurrentEvaluation(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [chatHook])

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [chatHook.messages])

  // 加载测评详情
  const loadEvaluationDetail = useCallback(async (evaluation: Evaluation) => {
    await chatHook.loadEvaluation(evaluation.id)
    setShowWelcome(false)
    setCurrentVersion(evaluation.version)

    if (isMobile) {
      setIsSidebarCollapsed(true)
    }
  }, [chatHook, isMobile])

  // 创建新测评
  const createNewEvaluation = useCallback(async (version: EvaluationVersion, title?: string) => {
    const evaluation = await chatHook.createEvaluation({
      version,
      title: title || (version === 'simple' ? '简易版测评' : '正常版测评'),
    })

    if (evaluation) {
      setCurrentVersion(version)
      setShowWelcome(false)

      await fetchOpeningMessage(evaluation.id, version)
    }
  }, [chatHook]) // eslint-disable-line react-hooks/exhaustive-deps

  // 快速开始
  const handleQuickStart = useCallback(async (version: EvaluationVersion, title: string) => {
    await createNewEvaluation(version, title)
  }, [createNewEvaluation])

  // 获取开场白
  const fetchOpeningMessage = useCallback(async (evaluationId: string, version: EvaluationVersion) => {
    try {
      const apiEndpoint = version === 'simple'
        ? '/api/spark-evaluator/simple'
        : '/api/spark-evaluator/chat'

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      })

      const data = await response.json()

      if (data.success && data.data?.message) {
        await chatHook.saveMessage({
          evaluation_id: evaluationId,
          content: data.data.message,
          role: 'assistant',
        })
      }
    } catch (error) {
      console.error('获取开场白失败:', error)
    }
  }, [chatHook])

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isSending || !chatHook.currentEvaluation) {
      return
    }

    setIsSending(true)
    const userMessage = input.trim()
    setInput('')

    await chatHook.sendMessage(userMessage)

    try {
      const apiEndpoint = currentVersion === 'simple'
        ? '/api/spark-evaluator/simple'
        : '/api/spark-evaluator/chat'

      const controller = new AbortController()
      streamAbortController.current = controller
      setIsStreaming(true)

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      })

      const data = await response.json()

      if (data.success && data.data?.message) {
        await chatHook.saveMessage({
          evaluation_id: chatHook.currentEvaluation!.id,
          content: data.data.message,
          role: 'assistant',
        })

        extractAndSaveEvaluationResult(data.data.message, chatHook.currentEvaluation!.id)
      }
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('发送消息失败:', error)
      }
    } finally {
      setIsSending(false)
      setIsStreaming(false)
      streamAbortController.current = null
    }
  }, [input, isSending, chatHook.currentEvaluation, currentVersion, chatHook]) // eslint-disable-line react-hooks/exhaustive-deps

  // 提取并保存测评结果
  const extractAndSaveEvaluationResult = useCallback(async (aiResponse: string, evaluationId: string) => {
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.total_score !== undefined) {
          await chatHook.saveResult({
            evaluation_id: evaluationId,
            total_score: parsed.total_score,
            salary_score: parsed.salary_score,
            workload_score: parsed.workload_score,
            growth_score: parsed.growth_score,
            environment_score: parsed.environment_score,
            atmosphere_score: parsed.atmosphere_score,
            mental_health_score: parsed.mental_health_score,
            evaluation_summary: parsed.evaluation_summary,
            suggestions: parsed.suggestions,
            dimensions: parsed.dimensions,
          })
          return
        }
      }

      const scoreMatch = aiResponse.match(/综合评分[：:]\s*(\d+(?:\.\d+)?)/i)
      if (scoreMatch) {
        const totalScore = parseFloat(scoreMatch[1])
        await chatHook.saveResult({
          evaluation_id: evaluationId,
          total_score: totalScore,
          evaluation_summary: aiResponse.substring(0, 500),
        })
      }
    } catch (error) {
      console.warn('提取测评结果失败:', error)
    }
  }, [chatHook])

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (streamAbortController.current) {
      streamAbortController.current.abort()
      setIsStreaming(false)
    }
  }, [])

  // 删除测评 - 显示确认对话框
  const handleDeleteEvaluation = useCallback(async (evaluationId: string) => {
    setDeleteDialog({ isOpen: true, evaluationId })
  }, [])

  // 确认删除测评
  const confirmDeleteEvaluation = useCallback(async () => {
    if (deleteDialog.evaluationId) {
      await chatHook.deleteEvaluation(deleteDialog.evaluationId)
      if (chatHook.evaluations.length === 0) {
        setShowWelcome(true)
      }
      setDeleteDialog({ isOpen: false, evaluationId: null })
    }
  }, [deleteDialog.evaluationId, chatHook])

  // 批量删除所有测评 - 显示确认对话框
  const handleDeleteAllEvaluations = useCallback(() => {
    setDeleteAllDialog({ isOpen: true })
  }, [])

  // 确认删除所有测评
  const confirmDeleteAllEvaluations = useCallback(async () => {
    const evaluationIds = chatHook.evaluations.map(ev => ev.id)
    await chatHook.deleteMultipleEvaluations(evaluationIds)
    setShowWelcome(true)
    setDeleteAllDialog({ isOpen: false })
  }, [chatHook])

  // 按键盘发送
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // 渲染欢迎界面
  if (showWelcome) {
    return (
      <div className="flex h-screen bg-gray-50 relative">
        {/* 移动端侧边栏遮罩层 */}
        {isMobile && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* 全局顶部导航栏 - 固定在顶部，z-index 50 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="打开侧边栏"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🐂</span>
              </div>
              <span className="text-xl font-bold text-gray-900">牛马测评仪</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回主页"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001-1h3m-6 0a1 1 0 001 1v3m10-11l2 2m-2-2v10a1 1 0 001-1h3a1 1 0 001 1v4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 侧边栏 - 参照智能核心的样式 */}
        <div className={`
          ${isMobile
        ? `fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 w-64 ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`
        : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`
      }
          ${isMobile ? 'pt-16' : 'pt-16'}
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {!isSidebarCollapsed && <h2 className="text-lg font-semibold">测评记录</h2>}
              <div className="flex items-center space-x-2">
                {(!isSidebarCollapsed || !isMobile) && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {chatHook.evaluations.length}
                  </span>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {isSidebarCollapsed
                ? (
                  <>
                    <button
                      onClick={() => {
                        setShowWelcome(true)
                        setIsSidebarCollapsed(false)
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="新建测评"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {chatHook.evaluations.length > 0 && (
                      <button
                        onClick={handleDeleteAllEvaluations}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        title="清空所有测评"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )
                : (
                  <>
                    <button
                      onClick={() => setShowWelcome(true)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      ➕ 新建测评
                    </button>
                    {chatHook.evaluations.length > 0 && (
                      <button
                        onClick={handleDeleteAllEvaluations}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        清空所有测评
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>

          {/* 测评列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatHook.evaluations.length === 0
              ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {isSidebarCollapsed
                    ? (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    )
                    : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📊</span>
                        </div>
                        <p className="text-sm">暂无测评记录</p>
                        <p className="text-xs mt-1">点击上方按钮开始测评</p>
                      </div>
                    )}
                </div>
              )
              : (
                chatHook.evaluations.map(evaluation => (
                  <div
                    key={evaluation.id}
                    onClick={() => loadEvaluationDetail(evaluation)}
                    className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
                      isSidebarCollapsed ? 'bg-gray-50' : 'bg-white'
                    }`}
                    title={evaluation.title}
                  >
                    {isSidebarCollapsed
                      ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs">
                              {evaluation.version === 'simple' ? '⚡' : '🐂'}
                            </span>
                          </div>
                        </div>
                      )
                      : (
                        <>
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {evaluation.version === 'simple' ? '⚡' : '🐂'}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {evaluation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(evaluation.updated_at).toLocaleDateString('zh-CN')}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvaluation(evaluation.id)
                            }}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                  </div>
                ))
              )}
          </div>
        </div>

        {/* 主内容区域 - 顶部留出导航栏高度 (pt-16) */}
        <div className="flex-1 flex flex-col pt-16 overflow-hidden">
          {/* 错误提示 */}
          {(localError || chatHook.error) && (
            <div className="fixed top-16 left-0 right-0 z-40 bg-red-50 border-b border-red-200 px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{localError || chatHook.error}</span>
                </div>
                <button
                  onClick={() => setLocalError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <NiuMaWelcomeScreen
              onQuickStart={handleQuickStart}
              onNewEvaluation={createNewEvaluation}
              onDeleteAll={handleDeleteAllEvaluations}
              evaluationCount={chatHook.evaluations.length}
            />
          </div>
        </div>
      </div>
    )
  }

  // 渲染聊天界面
  return (
    <>
      <div className="flex h-screen bg-gray-50 relative">
        {/* 移动端侧边栏遮罩层 */}
        {isMobile && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* 全局顶部导航栏 - 固定在顶部，z-index 50 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="打开侧边栏"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🐂</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {chatHook.currentEvaluation?.title || '牛马测评仪'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowWelcome(true)
                  setIsSidebarCollapsed(false)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回选择"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001-1h3m-6 0a1 1 0 001 1v3m10-11l2 2m-2-2v10a1 1 0 001-1h3a1 1 0 001 1v4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 侧边栏 - 参照智能核心的样式 */}
        <div className={`
        ${isMobile
      ? `fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 w-64 ${
        isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`
      : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`
    }
        ${isMobile ? 'pt-16' : 'pt-16'}
      `}>
          {/* 侧边栏头部 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {!isSidebarCollapsed && <h2 className="text-lg font-semibold">测评记录</h2>}
              <div className="flex items-center space-x-2">
                {(!isSidebarCollapsed || !isMobile) && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {chatHook.evaluations.length}
                  </span>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowWelcome(true)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                title="新建测评"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建测评
              </button>
              {chatHook.evaluations.length > 0 && (
                <button
                  onClick={handleDeleteAllEvaluations}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                  title="清空所有测评"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空所有
                </button>
              )}
            </div>
          </div>

          {/* 测评列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatHook.evaluations.length === 0
              ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {isSidebarCollapsed
                    ? (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    )
                    : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📊</span>
                        </div>
                        <p className="text-sm">暂无测评记录</p>
                        <p className="text-xs mt-1">点击上方按钮开始测评</p>
                      </div>
                    )}
                </div>
              )
              : (
                chatHook.evaluations.map(evaluation => (
                  <div
                    key={evaluation.id}
                    onClick={() => loadEvaluationDetail(evaluation)}
                    className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group ${
                      isSidebarCollapsed ? 'bg-gray-50' : 'bg-white'
                    }`}
                    title={evaluation.title}
                  >
                    {isSidebarCollapsed
                      ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs">
                              {evaluation.version === 'simple' ? '⚡' : '🐂'}
                            </span>
                          </div>
                        </div>
                      )
                      : (
                        <>
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {evaluation.version === 'simple' ? '⚡' : '🐂'}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {evaluation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(evaluation.updated_at).toLocaleDateString('zh-CN')}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvaluation(evaluation.id)
                            }}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                  </div>
                ))
              )}
          </div>
        </div>

        {/* 主聊天区域 */}
        <main className="flex-1 flex flex-col pt-16 overflow-hidden">
          {/* 消息列表 */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2"
          >
            {chatHook.isLoadingMessages
              ? (
                <div className="flex justify-center py-8">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )
              : (
                chatHook.messages.map((message, index) => (
                  <NiuMaMessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming && index === chatHook.messages.length - 1}
                    onCopy={() => {}}
                    onLike={() => {}}
                    onDislike={() => {}}
                    onRegenerate={() => {}}
                  />
                ))
              )}

            {chatHook.messages.length === 0 && !chatHook.isLoadingMessages && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>开始您的测评之旅吧！</p>
              </div>
            )}
          </div>

          {/* 测评结果展示 */}
          {chatHook.currentResult && (
            <div className="px-4 pb-4 shrink-0">
              <div className="bg-white rounded-2xl border border-pink-200 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  📊 测评结果
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-pink-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-1">
                      {chatHook.currentResult.total_score?.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">综合评分</div>
                  </div>
                  {chatHook.currentResult.salary_score && (
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {chatHook.currentResult.salary_score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">薪资回报</div>
                    </div>
                  )}
                  {chatHook.currentResult.workload_score && (
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {chatHook.currentResult.workload_score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">工作强度</div>
                    </div>
                  )}
                </div>
                {chatHook.currentResult.evaluation_summary && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">测评总结</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {chatHook.currentResult.evaluation_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入您的回答..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 bg-white transition-all"
                rows={2}
                disabled={isSending || isStreaming}
              />
              {isStreaming
                ? (
                  <button
                    onClick={stopGeneration}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    停止
                  </button>
                )
                : (
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isSending}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      !input.trim() || isSending
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    发送
                  </button>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* 确认删除对话框 */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="删除测评"
        message="确定要删除这个测评吗？此操作不可撤销。"
        onConfirm={confirmDeleteEvaluation}
        onCancel={() => setDeleteDialog({ isOpen: false, evaluationId: null })}
        type="danger"
      />
      {/* 确认删除所有测评对话框 */}
      <ConfirmDialog
        isOpen={deleteAllDialog.isOpen}
        title="删除所有测评"
        message={`确定要删除所有 ${chatHook.evaluations.length} 个测评记录吗？此操作不可恢复。`}
        onConfirm={confirmDeleteAllEvaluations}
        onCancel={() => setDeleteAllDialog({ isOpen: false })}
        type="danger"
      />
    </>
  )
}

export default IntegratedNiuMaChat
