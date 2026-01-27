'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { CreateEvaluationInput, EvaluationDataFromCoze } from '@/types/evaluation'
import EvaluationHistoryList from '@/app/components/evaluation/EvaluationHistoryList'
import { safeGetUser, safeGetSession } from '@/lib/authUtils'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const NiMaEvaluatorChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [retryCount, setRetryCount] = useState(0)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [evaluationData, setEvaluationData] = useState<EvaluationDataFromCoze | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [userToken, setUserToken] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false)
  const isCheckingRef = useRef(false) // 防止并发连接检查

  const scrollToBottom = () => {
    const container = messagesEndRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    // 需要滚动时自动滚动到底部
    if (shouldScrollToBottom) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  // 获取用户token并监听登录状态变化
  useEffect(() => {
    const getUserToken = async () => {
      try {
        console.log('=== 开始获取用户token ===')

        // 使用安全的函数获取用户
        const userResult = await safeGetUser()
        const user = userResult.user
        const userError = userResult.error
        console.log('safeGetUser result:', { user, userError })

        if (user) {
          console.log('用户已登录')
          setIsLoggedIn(true)

          // 使用安全的函数获取session
          const sessionResult = await safeGetSession()
          const session = sessionResult.session
          const sessionError = sessionResult.error
          console.log('safeGetSession result:', {
            hasSession: !!session,
            hasAccessToken: !!session?.access_token,
            sessionError,
          })

          if (session?.access_token) {
            console.log('设置userToken成功')
            setUserToken(session.access_token)
          } else {
            console.warn('session或access_token不存在')
          }
        } else {
          console.warn('用户未登录')
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error('获取用户token失败:', error)
        setIsLoggedIn(false)
      }
    }

    // 立即获取一次
    getUserToken()

    // 监听 Supabase 认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== 认证状态变化 ===')
      console.log('Event:', event)
      console.log('Has session:', !!session)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('用户已登录/Token已刷新')
          setIsLoggedIn(true)
          setUserToken(session.access_token)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('用户已登出')
        setIsLoggedIn(false)
        setUserToken('')
      }
    })

    // 清理订阅
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 组件加载时获取开场白(延迟执行,减少并发)
  useEffect(() => {
    // 防止重复初始化
    if (initializationRef.current || isCheckingRef.current) {
      return
    }

    initializationRef.current = true
    isCheckingRef.current = true

    // 延迟1-2秒后执行连接检查,避免多个组件同时初始化
    const checkConnection = async () => {
      setConnectionStatus('connecting')
      try {
        const response = await fetch('/api/spark-evaluator/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '', // 发送空消息获取开场白
          }),
        })

        const data = await response.json()
        console.log('=== 开场白 API 响应 ===')
        console.log('完整响应:', data)
        console.log('isMock:', data.isMock)
        console.log('data.data.message:', data.data?.message)

        // 只有非模拟响应才算真正连接成功
        if (!data.isMock && data.data?.message) {
          // 连接成功,显示从Coze返回的开场白
          const welcomeMessage = data.data.message
          console.log('使用 Coze 开场白:', welcomeMessage)

          setMessages([
            {
              role: 'assistant',
              content: welcomeMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('connected')
        } else if (data.isMock) {
          // 模拟响应，显示未响应消息
          console.warn('收到模拟响应')
          const errorMessage = '⚠️ AI 未响应'
          setMessages([
            {
              role: 'assistant',
              content: errorMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('disconnected')
        } else {
          // 响应中没有消息
          console.error('响应中没有消息内容')
          const errorMessage = '⚠️ AI 未响应'
          setMessages([
            {
              role: 'assistant',
              content: errorMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        console.error('连接失败:', error)
        // 连接失败，显示未响应消息
        const errorMessage = '⚠️ AI 未响应'

        setMessages([
          {
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
          },
        ])
        setConnectionStatus('disconnected')
        setShouldScrollToBottom(true)
      } finally {
        setIsInitializing(false)
        setShouldScrollToBottom(true)
        isCheckingRef.current = false
      }
    }

    // 延迟执行,减少并发压力
    const delay = Math.random() * 1000 + 500 // 0.5-1.5秒随机延迟
    const timer = setTimeout(() => {
      checkConnection()
    }, delay)

    return () => {
      clearTimeout(timer)
      isCheckingRef.current = false
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) { return }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    // 不改变连接状态，保持当前状态
    setShouldScrollToBottom(true) // 用户发送消息后滚动

    try {
      const response = await fetch('/api/spark-evaluator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      const data = await response.json()

      if (data.success && data.data?.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])

        // 尝试提取测评数据
        const extractedData = extractEvaluationData(data.data.message)
        if (extractedData) {
          setEvaluationData(extractedData)
          setShowSavePrompt(true)
        }

        // 保持当前连接状态，不改变
        // 如果之前是 connected，就保持 connected
        // 如果之前是 disconnected，就保持 disconnected
        setShouldScrollToBottom(true) // AI 回复后滚动
      } else {
        throw new Error(data.error || '获取AI回复失败')
      }
    } catch (error) {
      console.error('AI 响应错误:', error)
      // 只有在真正的网络错误时才设置为 disconnected
      setConnectionStatus('disconnected')
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ AI 未响应\n\n抱歉，AI 分析服务暂时无法响应。\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请稍后再试或点击"重新连接"按钮重试。`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setShouldScrollToBottom(true) // 错误消息后滚动
    } finally {
      setIsLoading(false)
    }
  }

  // 重新连接(优化版)
  const handleReconnect = async () => {
    if (retryCount >= 5) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '重连次数过多，请刷新页面后再试',
        timestamp: new Date(),
      }])
      return
    }

    setRetryCount(prev => prev + 1)
    setIsInitializing(true)
    setConnectionStatus('connecting')

    try {
      const response = await fetch('/api/spark-evaluator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '', // 发送空消息获取开场白
        }),
      })

      const data = await response.json()
      console.log('=== 重新连接 API 响应 ===')
      console.log('完整响应:', data)
      console.log('isMock:', data.isMock)
      console.log('data.data.message:', data.data?.message)

      // 只有非模拟响应才算真正连接成功
      if (!data.isMock && data.data?.message) {
        // 连接成功,显示从Coze返回的开场白
        const welcomeMessage = data.data.message
        console.log('使用 Coze 开场白 (重连):', welcomeMessage)

        setMessages([
          {
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
          },
        ])
        setConnectionStatus('connected')
        setRetryCount(0) // 成功后重置计数
        setShouldScrollToBottom(true)
      } else if (data.isMock) {
        // 模拟响应，显示未响应消息
        console.warn('重新连接收到模拟响应')
        const errorMessage = '⚠️ AI 未响应，正在重试...'

        setMessages([
          {
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
          },
        ])
        setConnectionStatus('disconnected')
        setShouldScrollToBottom(true)

        // 自动重试
        setTimeout(() => {
          if (retryCount < 4) {
            handleReconnect()
          }
        }, 3000)
      } else {
        // 响应中没有消息
        console.error('重新连接响应中没有消息内容')
        const errorMessage = '⚠️ AI 未响应，正在重试...'

        setMessages([
          {
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
          },
        ])
        setConnectionStatus('disconnected')
        setShouldScrollToBottom(true)

        // 自动重试
        setTimeout(() => {
          if (retryCount < 4) {
            handleReconnect()
          }
        }, 3000)
      }
    } catch (error) {
      console.error('重新连接失败:', error)
      // 连接失败，显示未响应消息
      const errorMessage = '⚠️ 连接失败，正在重试...'

      setMessages([
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        },
      ])
      setConnectionStatus('disconnected')
      setShouldScrollToBottom(true)

      // 自动重试
      setTimeout(() => {
        if (retryCount < 4) {
          handleReconnect()
        }
      }, 3000)
    } finally {
      setIsInitializing(false)
    }
  }

  // 从AI响应中提取测评数据
  const extractEvaluationData = (response: string): EvaluationDataFromCoze | null => {
    try {
      // 尝试提取JSON格式的数据
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.total_score !== undefined) {
          return parsed
        }
      }

      // 尝试用正则提取评分
      const scoreMatch = response.match(/综合评分[：:]\s*(\d+(?:\.\d+)?)/i)
      if (scoreMatch) {
        const totalScore = parseFloat(scoreMatch[1])
        return {
          total_score: totalScore,
          summary: `${response.substring(0, 200)}...`,
        }
      }

      // 检测是否是测评完成的消息
      const completionKeywords = ['测评完成', '综合评分', '总评分', '评估结果']
      if (completionKeywords.some(keyword => response.includes(keyword))) {
        return {
          total_score: 75, // 默认分数
          summary: `${response.substring(0, 200)}...`,
        }
      }

      return null
    } catch (error) {
      console.warn('提取测评数据失败:', error)
      return null
    }
  }

  // 保存测评记录
  const saveEvaluation = async (title: string) => {
    try {
      console.log('=== 开始保存测评记录 ===')
      console.log('Title:', title)
      console.log('Evaluation data:', evaluationData)

      // 使用安全的函数获取用户
      const userResult = await safeGetUser()
      const user = userResult.user
      const userError = userResult.error
      console.log('safeGetUser result:', { user, userError })

      if (!user) {
        console.error('用户未登录')
        setShowSavePrompt(false)
        window.location.href = '/login'
        return
      }

      // 使用安全的函数获取session
      const sessionResult = await safeGetSession()
      const session = sessionResult.session
      const sessionError = sessionResult.error
      console.log('safeGetSession result:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionError,
      })

      if (!session?.access_token) {
        console.error('Session或access_token缺失')
        setShowSavePrompt(false)
        window.location.href = '/login'
        return
      }

      const evaluationInput: CreateEvaluationInput = {
        title,
        total_score: evaluationData?.total_score || 75,
        salary_score: evaluationData?.dimensions?.薪资回报?.score,
        workload_score: evaluationData?.dimensions?.工作强度?.score,
        growth_score: evaluationData?.dimensions?.成长空间?.score,
        environment_score: evaluationData?.dimensions?.工作环境?.score,
        atmosphere_score: evaluationData?.dimensions?.团队氛围?.score,
        mental_health_score: evaluationData?.dimensions?.心理健康?.score,
        evaluation_summary: evaluationData?.summary,
        suggestions: evaluationData?.suggestions,
        chat_history: messages,
      }

      console.log('准备发送的数据:', evaluationInput)

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(evaluationInput),
      })

      const result = await response.json()

      console.log('API响应:', {
        status: response.status,
        ok: response.ok,
        result,
      })

      if (response.ok && result.success) {
        setShowSavePrompt(false)
        setEvaluationData(null)
      } else {
        console.error('保存失败:', result)
        throw new Error(result.error || '未知错误')
      }
    } catch (error) {
      console.error('保存测评记录失败:', error)
      throw error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* 历史记录弹窗 */}
      {showHistory && userToken && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="h-full w-full max-w-5xl mx-auto bg-white shadow-2xl flex flex-col">
            <EvaluationHistoryList
              userToken={userToken}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </div>
      )}

      {/* 保存提示弹窗 */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">保存测评记录</h3>
            <p className="text-gray-600 mb-4">
              检测到测评已完成,是否保存到历史记录？
            </p>
            {evaluationData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    {evaluationData.total_score?.toFixed(1)}分
                  </div>
                  <div className="text-sm text-gray-500">综合评分</div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测评标题
              </label>
              <input
                type="text"
                defaultValue={`测评 ${new Date().toLocaleDateString('zh-CN')}`}
                id="evaluation-title"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                placeholder="请输入测评标题"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSavePrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const titleInput = document.getElementById('evaluation-title') as HTMLInputElement
                  saveEvaluation(titleInput?.value || `测评 ${new Date().toLocaleDateString('zh-CN')}`)
                    .catch(() => {
                      // 保存失败时，保持弹窗打开
                    })
                }}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
        {/* 连接状态指示器 */}
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                  ? 'bg-pink-500 animate-pulse'
                  : 'bg-gray-400'
            }`}
            ></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected'
                ? '已连接'
                : connectionStatus === 'connecting'
                  ? '连接中...'
                  : '未连接'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* 登录状态提示 */}
            {!isLoggedIn && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                未登录 - 保存记录需先登录
              </div>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors flex items-center space-x-1"
            >
              <span>📊</span>
              <span>历史记录</span>
            </button>
            {connectionStatus === 'disconnected' && (
              <button
                onClick={handleReconnect}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                重新连接
              </button>
            )}
          </div>
        </div>

        {/* 消息列表 */}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {isInitializing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}
              >
                {message.role === 'assistant'
                  ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-ul:text-gray-800 prose-ol:text-gray-800">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-3">{children}</h1>,
                          h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-2">{children}</h2>,
                          h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2">{children}</h3>,
                          p: ({ children }: { children: React.ReactNode }) => <p className="text-gray-800 leading-relaxed mb-2">{children}</p>,
                          ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 text-gray-800 space-y-1">{children}</ul>,
                          ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-5 mb-2 text-gray-800 space-y-1">{children}</ol>,
                          li: ({ children }: { children: React.ReactNode }) => <li className="text-gray-800">{children}</li>,
                          strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          blockquote: ({ children }: { children: React.ReactNode }) => <blockquote className="border-l-4 border-pink-400 pl-3 my-2 bg-pink-50/50 py-1 pr-3 text-gray-700">{children}</blockquote>,
                          code: ({ children }: { children: React.ReactNode }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-800">{children}</code>,
                        }}
                      >
                        {message.content || ''}
                      </ReactMarkdown>
                    </div>
                  )
                  : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-pink-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && !isInitializing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-xl">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请描述您的职场处境..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none bg-white transition-all"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                !input.trim() || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 active:scale-[0.98]'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NiMaEvaluatorChat
