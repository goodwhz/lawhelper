'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  // 初始化
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      setCurrentUser(session.user)
      setIsAuthenticated(true)
      await loadConversations()
    } else {
      setIsAuthenticated(false)
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        setIsAuthenticated(true)
        loadConversations()
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setCurrentConversation(null)
        setConversations([])
        setMessages([])
        setIsAuthenticated(false)
      }
    })
  }

  // 加载对话列表
  const loadConversations = async () => {
    if (!currentUser) return

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
  }

  // 创建新对话
  const createNewConversation = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: currentUser.id,
          title: '新对话',
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('创建对话失败:', error)
        alert('创建对话失败: ' + error.message)
        return
      }

      console.log('创建对话成功:', data)
      await loadConversations()
      return data
    } catch (error) {
      console.error('创建对话失败:', error)
      alert('创建对话失败')
    }
  }

  // 加载特定对话
  const loadConversation = async (conversationId: string) => {
    if (!currentUser) return

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
  }

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !currentUser || !currentConversation) {
      alert('请先选择对话')
      return
    }

    setIsLoading(true)

    try {
      // 创建用户消息
      const userMessage = {
        conversation_id: currentConversation.id,
        user_id: currentUser.id,
        content: content.trim(),
        role: 'user' as const
      }

      const { data: savedUserMessage, error: userError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single()

      if (userError) {
        console.error('保存用户消息失败:', userError)
        alert('发送失败: ' + userError.message)
        setIsLoading(false)
        return
      }

      console.log('用户消息保存成功:', savedUserMessage)

      // 创建AI回复（模拟）
      const aiMessage = {
        conversation_id: currentConversation.id,
        user_id: currentUser.id,
        content: '这是一个测试回复。您的消息已成功保存到 Supabase 数据库！时间：' + new Date().toLocaleString(),
        role: 'assistant' as const
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
      alert('发送消息失败')
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
        onClick={() => loadConversation(conv.id)}
        className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
          currentConversation?.id === conv.id 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-gray-50'
        }`}
      >
        <div className="font-medium text-sm truncate">{conv.title}</div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(conv.updated_at || conv.created_at || '').toLocaleString()}
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
            <h1 className="text-xl font-bold">AI 助手 (简化版)</h1>
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
  )
}

export default SimpleChat