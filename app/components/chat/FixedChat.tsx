'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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

const FixedChat: React.FC = () => {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  // 初始化
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 检查认证状态...')
      
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.error('认证检查失败:', authError)
        setError('认证检查失败: ' + authError.message)
        setIsAuthenticated(false)
        return
      }
      
      if (session?.user) {
        console.log('✅ 用户已登录:', session.user.email)
        setCurrentUser(session.user)
        setIsAuthenticated(true)
        setError(null)
        await loadConversations()
      } else {
        console.log('❌ 用户未登录')
        setIsAuthenticated(false)
        setError('请先登录后再使用聊天功能')
      }

      // 监听认证状态变化
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('认证状态变化:', event)
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user)
          setIsAuthenticated(true)
          setError(null)
          await loadConversations()
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setCurrentConversation(null)
          setConversations([])
          setMessages([])
          setIsAuthenticated(false)
        }
      })
    } catch (error) {
      console.error('认证状态检查异常:', error)
      setError('认证检查异常: ' + (error as Error).message)
      setIsAuthenticated(false)
    }
  }

  // 加载对话列表
  const loadConversations = async () => {
    if (!currentUser) {
      console.error('❌ 没有当前用户，无法加载对话')
      return
    }

    console.log('🔄 开始加载对话列表...')
    setIsLoading(true)
    setError(null)

    try {
      // 先测试基本连接
      console.log('测试数据库连接...')
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('对话加载失败:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        
        // 根据错误类型提供具体建议
        let errorMessage = '对话加载失败'
        if (error.code === '42501' || error.message.includes('permission denied')) {
          errorMessage = '数据库权限不足，请联系管理员或检查 RLS 策略'
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = '数据库表不存在，请检查数据库迁移'
        } else {
          errorMessage = '对话加载失败: ' + error.message
        }
        
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      const convs = data || []
      console.log('✅ 成功加载对话，数量:', convs.length)
      setConversations(convs)

      if (convs.length === 0) {
        console.log('📝 没有现有对话，创建新对话...')
        await createNewConversation()
      } else {
        console.log('📝 加载第一个对话:', convs[0].id)
        await loadConversation(convs[0].id)
      }
    } catch (err) {
      console.error('加载对话时发生异常:', err)
      setError('加载对话时发生异常: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新对话
  const createNewConversation = async () => {
    if (!currentUser) {
      console.error('❌ 没有当前用户，无法创建对话')
      setError('无法创建对话：用户不存在')
      return null
    }

    console.log('🔄 开始创建新对话...')
    setIsLoading(true)
    setError(null)

    try {
      const conversationData = {
        user_id: currentUser.id,
        title: '新对话 - ' + new Date().toLocaleTimeString(),
        status: 'active'
      }
      
      console.log('对话数据:', conversationData)
      console.log('用户信息:', { id: currentUser.id, email: currentUser.email })
      
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) {
        console.error('对话创建失败:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        
        // 根据错误类型提供具体建议
        let errorMessage = '创建对话失败'
        if (error.code === '42501' || error.message.includes('permission denied')) {
          errorMessage = '数据库权限不足，这通常是 RLS 策略问题。请在 Supabase Dashboard 中执行：ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;'
        } else if (error.message.includes('null value')) {
          errorMessage = '数据验证失败：某些必填字段缺失'
        } else if (error.message.includes('duplicate key')) {
          errorMessage = '重复键值错误，请重试'
        } else {
          errorMessage = '创建对话失败: ' + error.message
        }
        
        setError(errorMessage)
        setIsLoading(false)
        return null
      }

      console.log('✅ 对话创建成功:', data)
      await loadConversations()
      return data
    } catch (err) {
      console.error('创建对话时发生异常:', err)
      setError('创建对话时发生异常: ' + (err as Error).message)
      return null
    }
  }

  // 加载特定对话
  const loadConversation = async (conversationId: string) => {
    if (!currentUser) return

    console.log('🔄 加载对话:', conversationId)

    try {
      // 获取对话信息
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', currentUser.id)
        .single()

      if (convError) {
        console.error('获取对话信息失败:', convError)
        setError('获取对话信息失败: ' + convError.message)
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
        console.error('获取消息失败:', msgError)
        setError('获取消息失败: ' + msgError.message)
        return
      }

      console.log('✅ 加载了', msgs?.length || 0, '条消息')
      setCurrentConversation(conversation)
      setMessages(msgs || [])

      // 滚动到底部
      setTimeout(() => {
        if (messageAreaRef.current) {
          messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('加载对话时发生异常:', error)
      setError('加载对话时发生异常: ' + (error as Error).message)
    }
  }

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !currentUser || !currentConversation) {
      console.error('无法发送消息:', {
        contentEmpty: !content.trim(),
        loading: isLoading,
        noUser: !currentUser,
        noConversation: !currentConversation
      })
      setError('无法发送消息：请确保已选择对话并输入内容')
      return
    }

    console.log('🔄 发送消息:', content)
    setIsLoading(true)
    setError(null)

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
        setError('发送消息失败: ' + userError.message)
        setIsLoading(false)
        return
      }

      console.log('✅ 用户消息保存成功:', savedUserMessage.id)

      // 创建AI回复
      const aiMessage = {
        conversation_id: currentConversation.id,
        user_id: currentUser.id,
        content: '这是修复版回复。您的消息 "' + content.trim() + '" 已成功保存！\\n\\n时间：' + new Date().toLocaleString(),
        role: 'assistant' as const
      }

      const { data: savedAiMessage, error: aiError } = await supabase
        .from('messages')
        .insert(aiMessage)
        .select()
        .single()

      if (aiError) {
        console.error('保存AI消息失败:', aiError)
        setError('AI回复失败: ' + aiError.message)
      } else {
        console.log('✅ AI消息保存成功:', savedAiMessage.id)
      }

      // 重新加载当前对话的消息
      await loadConversation(currentConversation.id)

    } catch (error) {
      console.error('发送消息时发生异常:', error)
      setError('发送消息时发生异常: ' + (error as Error).message)
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
            修复版AI助手
          </h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <p className="text-gray-600 mb-6">
            请先登录后使用AI助手功能
          </p>
          <button
            onClick={() => router.push('/auth/login')}
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
          <h2 className="text-lg font-semibold">对话列表 (修复版)</h2>
          <button 
            onClick={createNewConversation} 
            disabled={isLoading}
            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
          >
            {isLoading ? '创建中...' : '新建对话'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {renderConversationList()}
        </div>
        
        {/* 错误显示区域 */}
        {error && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-red-600">
              <div className="font-semibold mb-1">错误信息:</div>
              <div className="whitespace-pre-wrap">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">劳动法智能助手 (修复版)</h1>
            <div className="text-sm text-gray-600">
              👤 {currentUser?.email}
              <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth/login')
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

export default FixedChat