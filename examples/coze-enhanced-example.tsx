/**
 * Coze 增强版 API 使用示例
 * 这是一个完整的前端集成示例
 */

import React, { useState, useEffect } from 'react'

interface CozeMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CozeSession {
  sessionId: string
  userId: string
  createdAt: Date
  messageCount: number
}

export function CozeEnhancedChat() {
  const [userId] = useState(() => {
    // 生成或获取用户 ID
    if (typeof window !== 'undefined') {
      let uid = localStorage.getItem('coze_user_id')
      if (!uid) {
        uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        localStorage.setItem('coze_user_id', uid)
      }
      return uid
    }
    return 'anonymous'
  })

  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<CozeMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [disputeType, setDisputeType] = useState('工资争议')
  const [description, setDescription] = useState('')
  const [sessionStats, setSessionStats] = useState<any>(null)

  // 加载会话统计
  useEffect(() => {
    loadSessionStats()
  }, [])

  // 发送消息
  const sendMessage = async () => {
    if (!description.trim() || loading) { return }

    setLoading(true)

    // 添加用户消息
    const userMessage: CozeMessage = {
      role: 'user',
      content: description,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // 调用增强版 API
      const response = await fetch('/api/coze/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disputeType,
          description,
          userId,
          sessionId, // 如果有会话 ID，传递它
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 保存会话 ID
        if (data.data.sessionId) {
          setSessionId(data.data.sessionId)
          localStorage.setItem('coze_session_id', data.data.sessionId)
        }

        // 添加 AI 响应
        const assistantMessage: CozeMessage = {
          role: 'assistant',
          content: data.data.analysis.summary,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])

        // 更新会话统计
        if (data.data.sessionStats) {
          setSessionStats(data.data.sessionStats)
        }

        // 清空输入
        setDescription('')
      } else {
        throw new Error(data.error || '请求失败')
      }
    } catch (error: any) {
      console.error('发送消息失败:', error)

      // 添加错误消息
      const errorMessage: CozeMessage = {
        role: 'assistant',
        content: `抱歉，出现错误：${error.message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // 加载会话统计
  const loadSessionStats = async () => {
    try {
      const response = await fetch('/api/coze/chat/enhanced')
      const data = await response.json()

      if (data.success) {
        setSessionStats(data.stats)
      }
    } catch (error) {
      console.error('加载会话统计失败:', error)
    }
  }

  // 重新开始对话
  const resetConversation = () => {
    setMessages([])
    setSessionId('')
    localStorage.removeItem('coze_session_id')
    loadSessionStats()
  }

  // 初始化时加载保存的会话 ID
  useEffect(() => {
    const savedSessionId = localStorage.getItem('coze_session_id')
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">劳动争议智能咨询</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p>用户 ID: {userId}</p>
          {sessionId && <p>会话 ID: {sessionId}</p>}
          {sessionStats && (
            <p>
              会话统计: {sessionStats.totalSessions} 总计, {sessionStats.activeSessions} 活跃
            </p>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 min-h-[400px]">
        {messages.length === 0
          ? (
            <div className="text-center text-gray-500 py-12">
              <p>开始您的咨询吧</p>
            </div>
          )
          : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      {msg.content}
                    </div>
                    <div className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* 加载中 */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">争议类型</label>
          <select
            value={disputeType}
            onChange={e => setDisputeType(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="工资争议">工资争议</option>
            <option value="加班费">加班费</option>
            <option value="解除合同">解除合同</option>
            <option value="社会保险">社会保险</option>
            <option value="工伤赔偿">工伤赔偿</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">问题描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="请详细描述您遇到的问题..."
            className="w-full border rounded-lg px-4 py-2 h-32"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                sendMessage()
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">Ctrl + Enter 发送</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={sendMessage}
            disabled={loading || !description.trim()}
            className="flex-1 bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '发送'}
          </button>

          <button
            onClick={resetConversation}
            className="px-6 border rounded-lg py-2 hover:bg-gray-50"
          >
            重新开始
          </button>

          <button
            onClick={loadSessionStats}
            className="px-6 border rounded-lg py-2 hover:bg-gray-50"
          >
            刷新统计
          </button>
        </div>
      </div>

      {/* 会话信息 */}
      {sessionStats && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">系统状态</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{sessionStats.totalSessions}</div>
              <div className="text-sm text-gray-600">总会话数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{sessionStats.activeSessions}</div>
              <div className="text-sm text-gray-600">活跃会话</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{sessionStats.idleSessions}</div>
              <div className="text-sm text-gray-600">空闲会话</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{sessionStats.expiredSessions}</div>
              <div className="text-sm text-gray-600">过期会话</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 导出简化的 Hook 版本
export function useCozeEnhanced() {
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  const send = async (disputeType: string, description: string) => {
    if (!description.trim()) { return null }

    setLoading(true)

    try {
      const userId = localStorage.getItem('coze_user_id') || 'anonymous'

      const response = await fetch('/api/coze/chat/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeType,
          description,
          userId,
          sessionId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSessionId(data.data.sessionId || '')
        setStats(data.data.sessionStats)

        if (data.data.sessionId) {
          localStorage.setItem('coze_session_id', data.data.sessionId)
        }

        return data.data.analysis.summary
      }

      return null
    } catch (error) {
      console.error('Coze API 错误:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/coze/chat/enhanced')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const reset = () => {
    setSessionId('')
    setStats(null)
    localStorage.removeItem('coze_session_id')
  }

  useEffect(() => {
    const savedSessionId = localStorage.getItem('coze_session_id')
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }
    loadStats()
  }, [])

  return {
    sessionId,
    loading,
    stats,
    send,
    loadStats,
    reset,
  }
}
