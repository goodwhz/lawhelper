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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 组件加载时从 Coze 获取开场白
  useEffect(() => {
    const fetchWelcomeMessage = async () => {
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
        } else {
          // 如果 API 调用失败,使用默认开场白
          setMessages([
            {
              role: 'assistant',
              content: '您好!我是您的法律助手,可以帮助您分析劳动和人事争议问题。请告诉我您遇到了什么类型的争议,以及具体情况。',
              timestamp: new Date(),
            },
          ])
        }
      } catch (error) {
        console.error('获取开场白失败:', error)
        // 出错时使用默认开场白
        setMessages([
          {
            role: 'assistant',
            content: '您好!我是您的法律助手,可以帮助您分析劳动和人事争议问题。请告诉我您遇到了什么类型的争议,以及具体情况。',
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsInitializing(false)
      }
    }

    fetchWelcomeMessage()
  }, [])

  const callCozeAPI = async (userMessage: string): Promise<string> => {
    console.log('前端发送请求:', userMessage)

    const response = await fetch('/api/coze/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        disputeType: '劳动争议',
        description: userMessage,
      }),
    })

    console.log('API 响应状态:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      throw new Error(`API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    console.log('API 返回数据:', data)

    if (!data.success) {
      console.error('API 返回错误:', data.error, data.details)
      throw new Error(data.error || 'Coze API 调用失败')
    }

    return data.data?.analysis?.summary || '感谢您的咨询。根据您提供的信息,我建议您进一步详细描述争议的具体情况,包括时间、地点、涉及人员等关键信息,以便我为您提供更准确的分析和建议。'
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

    try {
      const assistantResponse = await callCozeAPI(userMessage.content)

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('前端错误:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉,系统暂时无法处理您的请求。\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请稍后再试或联系客服。`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    '工资争议',
    '解除合同',
    '加班费',
    '晋升争议',
    '调岗争议',
  ]

  return (
    <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
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
