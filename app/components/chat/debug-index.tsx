'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { sendChatMessage } from '@/service'

interface SimpleMessage {
  id: string
  content: string
  isAnswer: boolean
  debugInfo?: any
}

const DebugChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const addDebugLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev, `[${timestamp}] ${log}`])
  }, [])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsResponding(false)
    addDebugLog('用户停止生成')
  }, [addDebugLog])

  const handleSend = useCallback(async (content: string) => {
    if (isResponding || !content.trim()) return

    setIsResponding(false)

    const controller = new AbortController()
    abortControllerRef.current = controller

    addDebugLog(`开始发送消息: ${content.trim()}`)

    try {
      // 创建用户消息
      const userMessage: SimpleMessage = {
        id: `user_${Date.now()}`,
        content: content.trim(),
        isAnswer: false,
      }
      
      setMessages(prev => [...prev, userMessage])
      addDebugLog('添加用户消息到界面')

      // 创建空的AI消息
      const aiMessage: SimpleMessage = {
        id: `ai_${Date.now()}`,
        content: '',
        isAnswer: true,
        debugInfo: {},
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsResponding(true)
      addDebugLog('创建AI消息容器，开始请求')

      // 发送消息到Dify
      await sendChatMessage({
        inputs: {},
        query: content.trim(),
        response_mode: 'streaming',
        conversation_id: undefined,
        user: 'debug_user',
        auto_generate_name: true,
      }, {
        onData: (message: string, isFirstMessage: boolean, moreInfo: any) => {
          addDebugLog(`收到数据: "${message ? message.substring(0, 20) + '...' : '(空)'}" | 首次: ${isFirstMessage}`)
          addDebugLog(`MoreInfo: ${JSON.stringify(moreInfo)}`)
          
          // 更新最后一条AI消息
          setMessages(prev => {
            const newList = [...prev]
            const lastMessage = newList[newList.length - 1]
            if (lastMessage && lastMessage.isAnswer) {
              const beforeLength = lastMessage.content.length
              lastMessage.content += message
              const afterLength = lastMessage.content.length
              lastMessage.debugInfo = moreInfo
              
              if (afterLength > beforeLength) {
                addDebugLog(`内容增加: ${beforeLength} -> ${afterLength} 字符`)
              } else {
                addDebugLog('内容无变化，可能为重复')
              }
            }
            return newList
          })
        },
        onThought: (thought) => {
          addDebugLog(`Thought: ${JSON.stringify(thought)}`)
        },
        onFile: (file) => {
          addDebugLog(`File: ${JSON.stringify(file)}`)
        },
        onMessageEnd: (messageEnd) => {
          addDebugLog(`Message End: ${JSON.stringify(messageEnd)}`)
        },
        onMessageReplace: (messageReplace) => {
          addDebugLog(`Message Replace: ${JSON.stringify(messageReplace)}`)
        },
        onWorkflowStarted: (workflowStarted) => {
          addDebugLog(`Workflow Started: ${JSON.stringify(workflowStarted)}`)
        },
        onWorkflowFinished: (workflowFinished) => {
          addDebugLog(`Workflow Finished: ${JSON.stringify(workflowFinished)}`)
        },
        onNodeStarted: (nodeStarted) => {
          addDebugLog(`Node Started: ${JSON.stringify(nodeStarted)}`)
        },
        onNodeFinished: (nodeFinished) => {
          addDebugLog(`Node Finished: ${JSON.stringify(nodeFinished)}`)
        },
        onError: (msg: string, code?: string) => {
          addDebugLog(`错误: ${msg} | 代码: ${code}`)
          alert(`聊天错误: ${msg}`)
        },
        onCompleted: (hasError?: boolean) => {
          addDebugLog(`完成，有错误: ${hasError}`)
          setIsResponding(false)
          if (hasError) {
            alert('回复生成失败，请重试')
          }
        },
        getAbortController: (abortController) => {
          abortControllerRef.current = abortController
          addDebugLog('获取AbortController')
        }
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      addDebugLog(`发送失败: ${error}`)
      setIsResponding(false)
      alert('发送消息失败，请重试')
    }
  }, [isResponding, addDebugLog])

  const clearLogs = useCallback(() => {
    setDebugLogs([])
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  调试版AI助手
                </h1>
                <p className="text-gray-600">
                  这是一个调试版本，可以查看详细的数据流日志
                </p>
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
                  {message.content}
                  {message.isAnswer && message.debugInfo && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Debug: {JSON.stringify(message.debugInfo)}
                    </div>
                  )}
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

      {/* 调试日志区域 */}
      <div className="w-96 bg-gray-900 text-green-400 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">调试日志</h3>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            清空日志
          </button>
        </div>
        <div className="space-y-1 text-xs font-mono">
          {debugLogs.map((log, index) => (
            <div key={index} className="border-b border-gray-700 pb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DebugChatComponent