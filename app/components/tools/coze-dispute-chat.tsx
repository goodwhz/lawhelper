'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const CozeDisputeChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [detailInput, setDetailInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(10) // 最大重试次数
  const [retryDelay] = useState(2000) // 重试延迟（毫秒）
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const [lastAssistantHasQuestion, setLastAssistantHasQuestion] = useState(false)
  const [quickAnswers, setQuickAnswers] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 检测AI回复是否包含问句
  const containsQuestion = (text: string): boolean => {
    // 移除HTML标签后再检测
    const cleanText = text.replace(/<[^>]*>/g, '')

    // 检测问号、疑问词等
    const questionPatterns = [
      /\？/,
      /\?/,
      /请问/,
      /您的/i,
      /具体/i,
      /详细/i,
      /多久/i,
      /金额/i,
      /多少/i,
      /是否/i,
      /什么/i,
      /为什么/i,
      /如何/i,
      /吗$/,
      /请问/,
      /能否/,
      /可以/,
      /需要/i,
    ]

    const result = questionPatterns.some(pattern => pattern.test(cleanText))
    console.log('❓ 问题检测结果:', {
      originalTextLength: text.length,
      cleanTextLength: cleanText.length,
      cleanTextPreview: cleanText.substring(0, 100),
      hasQuestion: result,
      patterns: questionPatterns.map(p => p.test(cleanText)),
    })
    return result
  }

  // 检测AI回复是否包含问题，并生成快捷回复选项
  const detectQuestionAndGenerateAnswers = (aiResponse: string): { hasQuestion: boolean, answers: string[] } => {
    const hasQuestion = containsQuestion(aiResponse)

    let answers: string[] = []

    // 根据上下文生成快捷回复
    if (hasQuestion) {
      if (aiResponse.includes('争议类型') || aiResponse.includes('问题')) {
        answers = ['工资拖欠', '解除合同', '加班费', '就业歧视', '社保问题', '工伤待遇', '其他']
      } else if (aiResponse.includes('时间') || aiResponse.includes('多久')) {
        answers = ['1个月内', '3个月内', '半年内', '1年内', '超过1年']
      } else if (aiResponse.includes('金额') || aiResponse.includes('多少')) {
        answers = ['1000元以下', '1000-5000元', '5000-10000元', '1万-5万元', '5万元以上']
      } else if (aiResponse.includes('合同')) {
        answers = ['有书面合同', '只有口头约定', '没有合同']
      } else if (aiResponse.includes('证据')) {
        answers = ['有录音证据', '有书面证据', '有证人', '暂时没有证据']
      } else if (aiResponse.includes('是否')) {
        answers = ['是', '否', '不清楚']
      } else {
        answers = ['是', '否', '详细说明']
      }
    }

    return { hasQuestion, answers }
  }

  useEffect(() => {
    // 只在非初始化阶段且需要滚动时才滚动
    if (shouldScrollToBottom && !isInitializing) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom, isInitializing])

  // 调试：追踪关键状态变化
  useEffect(() => {
    console.log('📊 当前状态快照:', {
      questionCount,
      lastAssistantHasQuestion,
      isInitializing,
      isLoading,
      messagesCount: messages.length,
      shouldShowDetailArea: !isInitializing && !isLoading && lastAssistantHasQuestion && questionCount >= 5,
    })
  }, [questionCount, lastAssistantHasQuestion, isInitializing, isLoading, messages.length])

  // 组件加载时从 Coze 获取开场白
  useEffect(() => {
    // 防止重复初始化
    if (initializationRef.current) {
      return
    }

    initializationRef.current = true

    const fetchWelcomeMessage = async () => {
      setConnectionStatus('connecting')
      try {
        const response = await fetch('/api/coze/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disputeType: '初始化',
            description: '请用简短、友好的语言介绍一下自己是法律助手,能够帮助用户分析劳动和人事争议问题。',
          }),
        })

        const data = await response.json()
        if (data.success && data.data?.analysis?.summary) {
          setMessages([
            {
              role: 'assistant',
              content: data.data.analysis.summary,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('connected')
          setRetryCount(0)
          // 初始化时不滚动
        } else {
          throw new Error(data.error || '获取开场白失败')
        }
      } catch (error) {
        console.error('获取开场白失败:', error)
        setConnectionStatus('disconnected')
        // 出错时使用默认开场白
        setMessages([
          {
            role: 'assistant',
            content: `您好！我是劳动争议法律顾问，很高兴为您服务。
我可以为您提供以下帮助：

📋 争议类型分析
工资拖欠、加班费计算
解除劳动合同赔偿
就业歧视、社保缴纳
工伤待遇、竞业限制等

🛡️ 专业服务内容
法律分析与风险评估
维权流程指导
证据收集建议
解决方案推荐

为了给您提供更精准的建议，我会通过几个简单问题了解您的情况。

第一个问题：请问您遇到的具体劳动争议类型是什么？（工资拖欠 / 解除合同 / 就业歧视 / 社保问题 / 加班费 / 工伤待遇 / 其他）`,
            timestamp: new Date(),
          },
        ])
        // 初始化时也设置快捷回复选项
        const { answers: initAnswers } = detectQuestionAndGenerateAnswers(
          '请问您遇到的具体劳动争议类型是什么？',
        )
        setQuickAnswers(initAnswers)
        setLastAssistantHasQuestion(true)
        // 初始化时不滚动
      } finally {
        setIsInitializing(false)
      }
    }

    fetchWelcomeMessage()
  }, [])

  const callCozeAPI = async (userMessage: string): Promise<string> => {
    console.log('=== 前端开始发送请求 ===')
    console.log('用户消息:', userMessage)
    console.log('请求时间:', new Date().toISOString())
    setConnectionStatus('connecting')

    const requestBody = {
      disputeType: '劳动争议',
      description: userMessage,
    }
    console.log('请求体:', requestBody)

    // 带重试的 API 调用
    const attemptAPICall = async (attempt: number): Promise<string> => {
      console.log(`🔄 尝试 API 调用 (${attempt}/${maxRetries})...`)

      try {
        const response = await fetch('/api/coze/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('API 响应状态:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        const data = await response.json()
        console.log('=== API 返回完整数据 ===')
        console.log('JSON 数据:', JSON.stringify(data, null, 2))
        console.log('success:', data.success)
        console.log('data?.analysis?.summary:', data.data?.analysis?.summary)

        if (!data.success) {
          throw new Error(data.error || 'Coze API 调用失败')
        }

        const responseText = data.data?.analysis?.summary
        console.log('最终返回给前端的响应文本长度:', responseText?.length)
        console.log('响应文本前200字:', responseText?.substring(0, 200))

        setConnectionStatus('connected')
        return responseText || '感谢您的咨询。根据您提供的信息,我建议您进一步详细描述争议的具体情况,包括时间、地点、涉及人员等关键信息,以便我为您提供更准确的分析和建议。'
      } catch (error) {
        console.error(`❌ API 调用失败 (${attempt}/${maxRetries}):`, error)
        setConnectionStatus('disconnected')

        // 如果还有重试机会，延迟后继续重试
        if (attempt < maxRetries) {
          const delay = retryDelay * attempt // 指数退避
          console.log(`⏳ ${delay}ms 后将尝试第 ${attempt + 1} 次调用...`)
          await new Promise(resolve => setTimeout(resolve, delay))

          // 递归调用继续重试
          return attemptAPICall(attempt + 1)
        }

        // 所有重试都失败，抛出错误
        throw error
      }
    }

    // 开始尝试调用
    return attemptAPICall(1)
  }

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
    setShouldScrollToBottom(true) // 用户发送消息后滚动

    try {
      const assistantResponse = await callCozeAPI(userMessage.content)

      // 检测AI是否在反问
      const { hasQuestion, answers } = detectQuestionAndGenerateAnswers(assistantResponse)
      console.log('🔎 AI回复检测结果:', {
        hasQuestion,
        answers,
        responseLength: assistantResponse.length,
        responsePreview: assistantResponse.substring(0, 100),
      })
      setLastAssistantHasQuestion(hasQuestion)

      // 如果AI反问，增加问题计数器
      if (hasQuestion) {
        setQuestionCount((prev) => {
          const newCount = prev + 1
          console.log('✅ AI反问，当前问题计数:', newCount)
          return newCount
        })
      } else {
        // AI不再反问，重置计数器
        console.log('⏹️ AI不再反问，重置计数器')
        setQuestionCount(0)
      }

      setQuickAnswers(answers)

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setShouldScrollToBottom(true) // AI 回复后滚动
    } catch (error) {
      console.error('前端错误:', error)
      setConnectionStatus('disconnected')
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉,系统暂时无法处理您的请求。\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请稍后再试或联系客服。`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setShouldScrollToBottom(true) // 错误消息后滚动
    } finally {
      setIsLoading(false)
    }
  }

  // 处理详细信息输入
  const handleSendDetail = async () => {
    if (!detailInput.trim() || isLoading) { return }

    const userMessage: Message = {
      role: 'user',
      content: detailInput.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setDetailInput('')
    setIsLoading(true)
    setShouldScrollToBottom(true)

    try {
      const assistantResponse = await callCozeAPI(userMessage.content)

      // 检测AI是否在反问
      const { hasQuestion, answers } = detectQuestionAndGenerateAnswers(assistantResponse)
      console.log('🔎 AI回复检测结果:', {
        hasQuestion,
        answers,
        responseLength: assistantResponse.length,
        responsePreview: assistantResponse.substring(0, 100),
      })
      setLastAssistantHasQuestion(hasQuestion)

      // 如果AI反问，增加问题计数器
      if (hasQuestion) {
        setQuestionCount((prev) => {
          const newCount = prev + 1
          console.log('✅ AI反问，当前问题计数:', newCount)
          return newCount
        })
      } else {
        // AI不再反问，重置计数器
        console.log('⏹️ AI不再反问，重置计数器')
        setQuestionCount(0)
      }

      setQuickAnswers(answers)

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setShouldScrollToBottom(true)
    } catch (error) {
      console.error('前端错误:', error)
      setConnectionStatus('disconnected')
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉,系统暂时无法处理您的请求。\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请稍后再试或联系客服。`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setShouldScrollToBottom(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 重新连接
  const handleReconnect = async () => {
    if (retryCount >= maxRetries) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `重连次数已达${maxRetries}次，请稍后再试。您可以刷新页面或联系客服。`,
        timestamp: new Date(),
      }])
      return
    }

    setRetryCount(prev => prev + 1)
    setIsInitializing(true)
    initializationRef.current = false

    // 自动重试连接
    const attemptConnection = async (attempt: number): Promise<boolean> => {
      console.log(`🔄 尝试连接 (${attempt}/${maxRetries})...`)

      try {
        setConnectionStatus('connecting')

        const response = await fetch('/api/coze/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disputeType: '初始化',
            description: '请用简短、友好的语言介绍一下自己是法律助手,能够帮助用户分析劳动和人事争议问题。',
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data?.analysis?.summary) {
          console.log('✅ 连接成功！')
          setMessages([
            {
              role: 'assistant',
              content: data.data.analysis.summary,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('connected')
          setRetryCount(0)
          setIsInitializing(false)
          return true
        } else {
          throw new Error(data.error || '获取开场白失败')
        }
      } catch (error) {
        console.error(`❌ 连接失败 (${attempt}/${maxRetries}):`, error)
        setConnectionStatus('disconnected')

        // 如果还有重试机会，延迟后继续重试
        if (attempt < maxRetries) {
          console.log(`⏳ ${retryDelay}ms 后将尝试第 ${attempt + 1} 次连接...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // 递归调用继续重试
          return attemptConnection(attempt + 1)
        }

        // 所有重试都失败
        setIsInitializing(false)
        return false
      }
    }

    // 开始尝试连接
    await attemptConnection(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    '工资拖欠',
    '解除合同',
    '加班费',
    '就业歧视',
    '社保问题',
    '工伤待遇',
  ]

  return (
    <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
      {/* 连接状态指示器 */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected'
              ? '已连接'
              : connectionStatus === 'connecting'
                ? `连接中... (${retryCount}/${maxRetries})`
                : '未连接'}
          </span>
        </div>
        {connectionStatus === 'disconnected' && (
          <button
            onClick={handleReconnect}
            disabled={isInitializing}
            className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-all duration-300 flex items-center space-x-1 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isInitializing ? `重连中 (${retryCount}/${maxRetries})` : '重新连接'}</span>
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isInitializing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
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
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
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
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题/回复选项 */}
      {!isInitializing && !isLoading && (
        <div className="border-t border-gray-200 p-3">
          {/* AI反问时显示快捷回复选项 */}
          {lastAssistantHasQuestion && quickAnswers.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>您可以快速回复:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAnswers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(answer)
                      // 自动发送快捷回复
                      setTimeout(() => handleSend(), 100)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-full text-sm transition-all duration-300 border border-blue-200 hover:shadow-md"
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 初始状态显示快捷问题 */}
          {messages.length === 1 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">快捷问题:</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 详细信息输入区域 - 当问题计数超过5次时显示 */}
      {(() => {
        const shouldShow = !isInitializing && !isLoading && lastAssistantHasQuestion && questionCount >= 5
        console.log('🔍 详细信息区域显示条件检查:', { isInitializing, isLoading, lastAssistantHasQuestion, questionCount, shouldShow })
        return shouldShow
      })() && (
        <>
          {console.log('✅ 显示详细信息输入区域，问题计数:', questionCount)}
          <div className="border-t-4 border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-lg">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-base font-bold text-orange-800">详细说明区域</span>
                    <div className="text-xs text-orange-600">请补充完整信息以获得更准确的分析</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-orange-600">{questionCount}</span>
                  <span className="text-sm text-orange-700">个问题已问</span>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                <p className="text-sm text-gray-700 leading-relaxed">
                  💡 <strong>建议：</strong>为了更准确地为您分析争议，请详细描述以下信息：
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>具体时间（如：2024年1月入职）</li>
                  <li>涉及人员（如：公司名称、部门负责人等）</li>
                  <li>争议经过（如：无故辞退、拖欠工资的具体情况）</li>
                  <li>争议金额（如：拖欠工资XX元）</li>
                  <li>相关证据（如：合同、工资条、聊天记录等）</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <div>
                <label htmlFor="detail-input" className="block text-sm font-medium text-gray-700 mb-2">
                  请详细描述您的争议情况
                </label>
                <textarea
                  id="detail-input"
                  name="detail-input"
                  value={detailInput}
                  onChange={e => setDetailInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendDetail()
                    }
                  }}
                  placeholder="例如：我于2024年1月3日入职某某公司，签订了3年劳动合同。2024年6月15日，公司领导突然找我谈话，说公司裁员，让我当天离职，但拒绝支付任何经济补偿。我的月工资是8000元，被拖欠了6月份的工资。我有劳动合同、工资条和解除劳动合同通知书..."
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white shadow-sm"
                  rows={6}
                  disabled={isLoading}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {detailInput.length} 字
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSendDetail}
                  disabled={!detailInput.trim() || isLoading}
                  className={`px-8 py-3 rounded-lg font-bold text-base transition-all duration-300 flex items-center space-x-2 ${
                    !detailInput.trim() || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>提交详细信息</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 调试信息显示 */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-xs text-yellow-800">
        <div className="font-bold mb-1">🐛 调试信息:</div>
        <div>问题计数: {questionCount} / 5</div>
        <div>AI在反问: {lastAssistantHasQuestion ? '是' : '否'}</div>
        <div>初始化中: {isInitializing ? '是' : '否'}</div>
        <div>加载中: {isLoading ? '是' : '否'}</div>
        <div>显示详细区域: {(!isInitializing && !isLoading && lastAssistantHasQuestion && questionCount >= 5) ? '是' : '否'}</div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        {connectionStatus === 'disconnected'
          ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">连接已断开</span>
              </div>
              <button
                onClick={handleReconnect}
                disabled={isInitializing}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isInitializing ? `重连中 (${retryCount}/${maxRetries})` : '重新连接'}</span>
              </button>
            </div>
          )
          : (
            <div className="flex space-x-2">
              <textarea
                id="message-input"
                name="message-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  questionCount >= 5
                    ? '也可以直接在此输入您的回复...'
                    : lastAssistantHasQuestion
                      ? '请回答上述问题，或者手动输入您的回复...'
                      : '请输入您的问题或描述争议情况...'
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  !input.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                发送
              </button>
            </div>
          )}
      </div>
    </div>
  )
}

export default CozeDisputeChat
