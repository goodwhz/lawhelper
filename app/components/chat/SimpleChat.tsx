'use client'
import React, { useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface Message {
  id: string
  conversation_id?: string
  user_id?: string
  content: string
  role: 'user' | 'assistant'
  created_at?: string
}

interface Conversation {
  id: string
  user_id?: string
  title: string
  status?: string
  created_at?: string
  updated_at?: string
}

const SimpleChat: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    conversationId?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Toast 通知状态
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info',
  })

  // 显示 Toast 通知
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    if (!currentUser) { return }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('加载对话失败:', error)
        return
      }

      const convs = data || []
      setConversations(convs)

      if (convs.length === 0) {
        await createNewConversation()
      } else {
        await loadConversation(convs[0].id)
      }
    } catch (error) {
      console.error('加载对话失败:', error)
    }
  }, [currentUser])

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!currentUser || !conversationId) {
      showToast('删除失败: 用户未登录或对话ID无效', 'error')
      return false
    }

    try {
      console.log('开始删除对话，ID:', conversationId)

      // 使用API删除对话
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.id,
          'X-User-Email': currentUser.email || '',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('删除失败:', errorText)
        throw new Error('删除对话失败')
      }

      // 从本地列表中移除对话
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      // 如果删除的是当前对话，跳转到主界面
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }

      showToast('对话删除成功', 'success')
      return true
    } catch (error) {
      console.error('删除对话失败:', error)
      showToast('删除对话失败', 'error')
      return false
    }
  }, [currentUser, currentConversation])

  // 显示删除确认对话框
  const showDeleteConfirm = (conversationId: string, conversationTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除确认',
      message: `确定要删除对话"${conversationTitle}"吗？此操作不可撤销！`,
      conversationId,
      onConfirm: () => deleteConversation(conversationId),
    })
  }

  // 创建新对话
  const createNewConversation = async () => {
    if (!currentUser) { return }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: currentUser.id,
          title: '新对话',
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('创建对话失败:', error)
        showToast(`创建对话失败: ${error.message}`, 'error')
        return
      }

      console.log('创建对话成功:', data)
      await loadConversations()
      return data
    } catch (error) {
      console.error('创建对话失败:', error)
      showToast('创建对话失败', 'error')
    }
  }

  // 加载特定对话
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) { return }

    try {
      // 获取对话信息
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', currentUser.id)
        .single()

      if (convError) {
        console.error('加载对话失败:', convError)
        return
      }

      // 获取消息
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('加载消息失败:', msgError)
        return
      }

      setCurrentConversation(conversation)
      setMessages(msgs || [])

      // 滚动到底部
      setTimeout(() => {
        if (messageAreaRef.current) {
          messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('加载对话失败:', error)
    }
  }, [currentUser])

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !currentUser || !currentConversation) {
      showToast('请先选择对话', 'warning')
      return
    }

    setIsLoading(true)

    try {
      // 创建用户消息
      const userMessage = {
        conversation_id: currentConversation.id,
        user_id: currentUser.id,
        content: content.trim(),
        role: 'user' as const,
      }

      const { data: savedUserMessage, error: userError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single()

      if (userError) {
        console.error('保存用户消息失败:', userError)
        showToast(`发送失败: ${userError.message}`, 'error')
        setIsLoading(false)
        return
      }

      console.log('用户消息保存成功:', savedUserMessage)

      // 创建AI回复（模拟）
      const aiMessage = {
        conversation_id: currentConversation.id,
        user_id: currentUser.id,
        content: `这是一个测试回复。您的消息已成功保存到 Supabase 数据库！时间：${new Date().toLocaleString()}`,
        role: 'assistant' as const,
      }

      const { data: savedAiMessage, error: aiError } = await supabase
        .from('messages')
        .insert(aiMessage)
        .select()
        .single()

      if (aiError) {
        console.error('保存AI消息失败:', aiError)
      } else {
        console.log('AI消息保存成功:', savedAiMessage)
      }

      // 重新加载当前对话的消息
      await loadConversation(currentConversation.id)
    } catch (error) {
      console.error('发送消息失败:', error)
      showToast('发送消息失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // 渲染对话列表
  const renderConversationList = () => {
    if (conversations.length === 0) {
      return <p className="text-gray-500 text-sm">暂无对话</p>
    }

    return conversations.map(conv => (
      <div
        key={conv.id}
        className={`p-3 rounded-lg hover:bg-gray-100 transition-colors ${
          currentConversation?.id === conv.id
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50'
        }`}
      >
        <div
          className="cursor-pointer"
          onClick={() => loadConversation(conv.id)}
        >
          <div className="font-medium text-sm truncate">{conv.title}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(conv.updated_at || conv.created_at || '').toLocaleString()}
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              showDeleteConfirm(conv.id, conv.title)
            }}
            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    ))
  }

  // 渲染消息
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-10">
          <p>👋 你好！我是你的AI助手</p>
          <p className="mt-2">有什么可以帮助你的吗？</p>
        </div>
      )
    }

    return messages.map(msg => (
      <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
        <div className={`message-bubble px-4 py-2 rounded-lg ${
          msg.role === 'assistant'
            ? 'bg-white border border-gray-200 text-gray-900'
            : 'bg-blue-600 text-white'
        }`}>
          {msg.role === 'assistant' && (
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs">🤖</span>
              </div>
              <span className="text-sm text-gray-600">AI助手</span>
            </div>
          )}
          <div className="message-content whitespace-pre-wrap">{msg.content}</div>
          {msg.role === 'user' && (
            <div className="text-xs text-blue-100 mt-2 text-right">用户</div>
          )}
        </div>
      </div>
    ))
  }

  // 显示未登录状态
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            专业劳动法AI助手
          </h1>
          <p className="text-gray-600 mb-6">
            请先登录后使用AI助手功能
          </p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            请登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* 侧边栏 */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">对话列表</h2>
            <button
              onClick={createNewConversation}
              className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              新建对话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderConversationList()}
          </div>
        </div>

        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col">
          {/* 头部 */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">劳动法智能助手 (简化版)</h1>
              <div className="text-sm text-gray-600">
                👤 {currentUser?.email}
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = '/auth/login'
                  }}
                  className="ml-2 text-sm text-red-600 hover:text-red-800"
                >
                  退出
                </button>
              </div>
            </div>
          </div>

          {/* 消息区域 */}
          <div
            ref={messageAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {renderMessages()}
          </div>

          {/* 输入区域 */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const message = formData.get('message') as string
                if (message?.trim()) {
                  sendMessage(message.trim())
                  e.currentTarget.reset()
                }
              }}
              className="flex space-x-2"
            >
              <input
                name="message"
                placeholder="输入您的消息..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-4">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
            toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          } ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : toast.type === 'warning'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center">
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  )
}

export default SimpleChat
