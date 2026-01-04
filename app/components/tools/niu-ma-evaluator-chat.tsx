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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false)

  const scrollToBottom = () => {
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  useEffect(() => {
    // 只在非初始化阶段且需要滚动时才滚动
    if (shouldScrollToBottom && !isInitializing) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom, isInitializing])

  // 组件加载时获取开场白
  useEffect(() => {
    // 防止重复初始化
    if (initializationRef.current) {
      return
    }

    initializationRef.current = true

    const fetchWelcomeMessage = async () => {
      setConnectionStatus('connecting')
      try {
        const response = await fetch('/api/spark-evaluator/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '系统指令：请生成一个简洁的开场白（不超过100字）。介绍你是"牛马测评仪"，可以帮助用户评估职场处境、提供专业建议。语调要友好、专业。不要使用emoji表情符号。',
          }),
        })

        const data = await response.json()
        if (data.success && data.data?.message) {
          // 清理响应，移除多余的换行和空格
          const cleanMessage = data.data.message.replace(/\n+/g, '\n').trim()

          // 如果是模拟响应，添加提示
          const finalMessage = data.isMock
            ? `⚠️ AI 未响应\n\n${cleanMessage}`
            : cleanMessage

          setMessages([
            {
              role: 'assistant',
              content: finalMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus(data.isMock ? 'disconnected' : 'connected')
          setRetryCount(0)
          // 初始化时不滚动
        } else {
          throw new Error(data.error || '获取开场白失败')
        }
      } catch (error) {
        console.error('获取开场白失败:', error)
        setConnectionStatus('disconnected')
        setMessages([
          {
            role: 'assistant',
            content: '⚠️ AI 未响应\n\n您好！我是牛马测评仪，可以帮您评估职场处境、提供专业的分析和建议。请告诉我您的职场情况吧！',
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
        // 如果是模拟响应，标记为未连接
        if (data.isMock) {
          setConnectionStatus('disconnected')
        } else {
          setConnectionStatus('connected')
        }
        setShouldScrollToBottom(true) // AI 回复后滚动
      } else {
        throw new Error(data.error || '获取AI回复失败')
      }
    } catch (error) {
      console.error('AI 响应错误:', error)
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
        const response = await fetch('/api/spark-evaluator/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '系统指令：请生成一个简洁的开场白（不超过100字）。介绍你是"牛马测评仪"，可以帮助用户评估职场处境、提供专业建议。语调要友好、专业。不要使用emoji表情符号。',
          }),
        })

        const data = await response.json()
        if (data.success && data.data?.message) {
          // 清理响应，移除多余的换行和空格
          const cleanMessage = data.data.message.replace(/\n+/g, '\n').trim()

          // 如果是模拟响应，添加提示
          const finalMessage = data.isMock
            ? `⚠️ AI 未响应\n\n${cleanMessage}`
            : cleanMessage

          setMessages([
            {
              role: 'assistant',
              content: finalMessage,
              timestamp: new Date(),
            },
          ])
          setConnectionStatus(data.isMock ? 'disconnected' : 'connected')
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
    '经常加班没有加班费',
    '领导不合理安排工作',
    '工资低于市场水平',
    '职场被边缘化',
    '没有晋升机会',
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
      <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-100 text-gray-800'
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
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-400 pl-3 my-2 bg-purple-50 py-1 pr-3 text-gray-700">{children}</blockquote>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs text-gray-800">{children}</code>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )
                : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
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
            placeholder="请描述您的职场处境..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !input.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
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
