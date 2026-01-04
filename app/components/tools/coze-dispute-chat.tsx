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
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // 只在非初始化阶段且需要滚动时才滚动
    if (shouldScrollToBottom && !isInitializing) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom, isInitializing])

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
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      setConnectionStatus('disconnected')
      throw new Error(`API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    console.log('=== API 返回完整数据 ===')
    console.log('JSON 数据:', JSON.stringify(data, null, 2))
    console.log('success:', data.success)
    console.log('data?.analysis?.summary:', data.data?.analysis?.summary)

    if (!data.success) {
      console.error('API 返回错误:', data.error, data.details)
      setConnectionStatus('disconnected')
      throw new Error(data.error || 'Coze API 调用失败')
    }

    const responseText = data.data?.analysis?.summary
    console.log('最终返回给前端的响应文本长度:', responseText?.length)
    console.log('响应文本前200字:', responseText?.substring(0, 200))

    setConnectionStatus('connected')
    return responseText || '感谢您的咨询。根据您提供的信息,我建议您进一步详细描述争议的具体情况,包括时间、地点、涉及人员等关键信息,以便我为您提供更准确的分析和建议。'
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

  // 重新连接
  const handleReconnect = async () => {
    if (retryCount >= 3) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '重连次数过多，请稍后再试',
        timestamp: new Date(),
      }])
      return
    }

    setRetryCount(prev => prev + 1)
    setIsInitializing(true)
    initializationRef.current = false

    // 重新获取开场白
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
        console.error('重新连接失败:', error)
        setConnectionStatus('disconnected')
      } finally {
        setIsInitializing(false)
      }
    }

    await fetchWelcomeMessage()
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
                ? '连接中...'
                : '未连接'}
          </span>
        </div>
        {connectionStatus === 'disconnected' && (
          <button
            onClick={handleReconnect}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            重新连接
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

      {/* 快捷问题 */}
      {!isInitializing && messages.length === 1 && (
        <div className="border-t border-gray-200 p-3">
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

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入您的问题或描述争议情况..."
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
      </div>
    </div>
  )
}

export default CozeDisputeChat
