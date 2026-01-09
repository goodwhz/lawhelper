'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

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
            message: '',
          }),
        })

        const data = await response.json()

        // 只有非模拟响应才算真正连接成功
        if (!data.isMock) {
          // 连接成功，显示固定开场白
          const welcomeMessage = '您好！我是牛马测评仪，我将通过几轮简单提问，帮你测算当前工作的真实性价比～，现在开始吧！\n\n现在开始第一步：请输入你的年薪（例如一万就输 10000哦）'

          setMessages([
            {
              role: 'assistant',
              content: welcomeMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus('connected')
        } else {
          // 模拟响应，显示未响应消息
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
    setConnectionStatus('connecting')
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
          message: '',
        }),
      })

      const data = await response.json()

      // 只有非模拟响应才算真正连接成功
      if (!data.isMock) {
        // 连接成功，显示固定开场白
        const welcomeMessage = '您好！我是牛马测评仪，我将通过几轮简单提问，帮你测算当前工作的真实性价比～，现在开始吧！\n\n现在开始第一步：请输入你的年薪（例如一万就输 10000哦）'

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
      } else {
        // 模拟响应，显示未响应消息
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
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
            className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            重新连接
          </button>
        )}
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
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-800 leading-relaxed mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-gray-800 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 text-gray-800 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-800">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-pink-400 pl-3 my-2 bg-pink-50/50 py-1 pr-3 text-gray-700">{children}</blockquote>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-800">{children}</code>,
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
            onKeyPress={handleKeyPress}
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
  )
}

export default NiMaEvaluatorChat
