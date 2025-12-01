'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'

interface SimpleMessage {
  id: string
  content: string
  isAnswer: boolean
}

const SimpleChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [showQuickResponse, setShowQuickResponse] = useState(true)
  const [error, setError] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsResponding(false)
  }, [])

  const handleSend = useCallback(async (content: string) => {
    if (isResponding || !content.trim()) return

    setIsResponding(true)
    setShowQuickResponse(false)
    setError('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 创建用户消息
      const userMessage: SimpleMessage = {
        id: `user_${Date.now()}`,
        content: content.trim(),
        isAnswer: false,
      }
      
      setMessages(prev => [...prev, userMessage])

      // 创建空的AI消息
      const aiMessage: SimpleMessage = {
        id: `ai_${Date.now()}`,
        content: '',
        isAnswer: true,
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsResponding(true)

      // 发送消息到API
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: content.trim(),
          response_mode: 'streaming',
          conversation_id: undefined,
          user: 'user_simple',
          auto_generate_name: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentContent = ''
      let isWorkflowMode = false
      let lastProcessedAnswer = ''

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('流式响应结束')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              // 处理不同类型的事件
              if (parsed.event === 'message' || parsed.event === 'agent_message') {
                // 在workflow模式下跳过普通消息事件
                if (isWorkflowMode) {
                  console.log('跳过workflow模式下的message事件')
                  continue
                }
                
                if (parsed.answer) {
                  currentContent += parsed.answer
                  setMessages(prev => {
                    const newList = [...prev]
                    const lastMessage = newList[newList.length - 1]
                    if (lastMessage && lastMessage.isAnswer) {
                      lastMessage.content = currentContent
                    }
                    return newList
                  })
                }
              }
              else if (parsed.event === 'workflow_started') {
                isWorkflowMode = true
                console.log('进入workflow模式')
              }
              else if (parsed.event === 'workflow_finished' && parsed.data?.outputs?.answer) {
                let answer = parsed.data.outputs.answer || ''
                if (answer) {
                  // 检查是否是新的答案内容
                  if (!lastProcessedAnswer) {
                    currentContent = answer
                    setMessages(prev => {
                      const newList = [...prev]
                      const lastMessage = newList[newList.length - 1]
                      if (lastMessage && lastMessage.isAnswer) {
                        lastMessage.content = currentContent
                      }
                      return newList
                    })
                  } else if (answer.length > lastProcessedAnswer.length) {
                    // 只添加增量内容
                    const incrementalContent = answer.substring(lastProcessedAnswer.length)
                    currentContent += incrementalContent
                    setMessages(prev => {
                      const newList = [...prev]
                      const lastMessage = newList[newList.length - 1]
                      if (lastMessage && lastMessage.isAnswer) {
                        lastMessage.content = currentContent
                      }
                      return newList
                    })
                  }
                  lastProcessedAnswer = answer
                }
              }
              else if (parsed.event === 'message_end') {
                console.log('消息结束')
              }
            } catch (e) {
              console.warn('解析数据失败:', e)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('发送消息失败:', error)
      if (error.name === 'AbortError') {
        console.log('请求被取消')
      } else {
        setError(error.message || '发送消息失败，请重试')
      }
    } finally {
      setIsResponding(false)
    }
  }, [isResponding])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showQuickResponse && messages.length === 0 && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  专业劳动法AI助手
                </h1>
                <p className="text-gray-600">
                  我是您的专业劳动法助手，可以为您提供劳动法相关的咨询和帮助
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('劳动合同的基本要素有哪些？')}>
                  <h3 className="font-medium text-gray-900 mb-2">劳动合同咨询</h3>
                  <p className="text-sm text-gray-600">了解劳动合同的基本要素和注意事项</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('加班工资应该如何计算？')}>
                  <h3 className="font-medium text-gray-900 mb-2">工资计算</h3>
                  <p className="text-sm text-gray-600">了解加班工资、最低工资等计算方式</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('解除劳动合同需要什么条件？')}>
                  <h3 className="font-medium text-gray-900 mb-2">解除劳动关系</h3>
                  <p className="text-sm text-gray-600">了解解除劳动合同的条件和程序</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleSend('社保缴纳的标准是什么？')}>
                  <h3 className="font-medium text-gray-900 mb-2">社会保险</h3>
                  <p className="text-sm text-gray-600">了解社保缴纳比例和标准</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.isAnswer ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-2xl px-4 py-2 rounded-lg ${
                message.isAnswer 
                  ? 'bg-white border border-gray-200 text-gray-900' 
                  : 'bg-blue-600 text-white'
              }`}>
                {message.isAnswer && (
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">🤖</span>
                    </div>
                    <span className="text-sm text-gray-600">AI助手</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {message.content || (message.isAnswer && isResponding && '正在思考中...')}
                </div>
                {!message.isAnswer && (
                  <div className="flex items-center mt-2 justify-end">
                    <span className="text-xs text-blue-100">用户</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-2xl px-4 py-2 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs">🤖</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI正在思考中...</span>
                    <button
                      onClick={handleStop}
                      className="ml-4 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                    >
                      停止
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const message = formData.get('message') as string
              if (message?.trim()) {
                handleSend(message.trim())
                e.currentTarget.reset()
              }
            }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-end space-x-2">
              <textarea
                name="message"
                placeholder="请输入您的问题..."
                disabled={isResponding}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const form = e.currentTarget.form
                    if (form) {
                      const formData = new FormData(form)
                      const message = formData.get('message') as string
                      if (message?.trim()) {
                        handleSend(message.trim())
                        form.reset()
                      }
                    }
                  }
                }}
              />
              <button
                type="submit"
                disabled={isResponding}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isResponding ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SimpleChatComponent