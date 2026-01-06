'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { ChatMessage, Conversation } from './types'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import WelcomeScreen from '@/app/components/ui/WelcomeScreen'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 增强型消息缓存 - 支持TTL和内存管理
const messageCache = new Map<string, { messages: ChatMessage[], timestamp: number, ttl: number }>()
const conversationCache = new Map<string, { conversation: Conversation, timestamp: number, ttl: number }>()

// 缓存管理配置
const CACHE_CONFIG = {
  // 消息缓存TTL（毫秒）
  MESSAGE_TTL: 5 * 60 * 1000, // 5分钟
  // 对话缓存TTL（毫秒）
  CONVERSATION_TTL: 10 * 60 * 1000, // 10分钟
  // 最大缓存条目数
  MAX_CACHE_SIZE: 50,
  // 清理间隔（毫秒）
  CLEANUP_INTERVAL: 60 * 1000, // 1分钟
}

// 缓存清理函数
const cleanupCache = () => {
  const now = Date.now()

  // 清理过期消息缓存
  for (const [key, value] of messageCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      messageCache.delete(key)
    }
  }

  // 清理过期对话缓存
  for (const [key, value] of conversationCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      conversationCache.delete(key)
    }
  }

  // 控制缓存大小
  if (messageCache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const entries = Array.from(messageCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    entries.slice(0, Math.floor(entries.length * 0.2)).forEach(([key]) => messageCache.delete(key))
  }

  if (conversationCache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const entries = Array.from(conversationCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    entries.slice(0, Math.floor(entries.length * 0.2)).forEach(([key]) => conversationCache.delete(key))
  }
}

// 定期清理缓存
setInterval(cleanupCache, CACHE_CONFIG.CLEANUP_INTERVAL)

const IntegratedChat: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false)
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  // 自动滚动状态
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)

  // 性能优化状态
  const [_isPreloading, _setIsPreloading] = useState(false)
  const [_preloadedConversations, _setPreloadedConversations] = useState<Map<string, ChatMessage[]>>(new Map())
  const [_visibleMessageCount, _setVisibleMessageCount] = useState(20) // 初始显示的消息数量

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type?: 'danger' | 'info' | 'warning'
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
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  // 自动滚动函数
  const scrollToBottom = useCallback(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTo({
        top: messageAreaRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom, scrollToBottom])

  // 欢迎界面状态
  const [showWelcome, setShowWelcome] = useState(true)

  // 加载对话列表 - 优化版本
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) {
      console.error('加载对话失败: 用户不存在')
      return []
    }

    // 检查用户ID是否存在
    if (!user.id) {
      console.error('加载对话失败: 用户ID不存在', user)
      return []
    }

    try {
      console.log('开始加载对话列表，用户ID:', user.id)
      console.log('用户认证状态:', isAuthenticated)

      // 首先检查用户是否有有效的认证会话
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('用户会话无效:', sessionError)
        throw new Error('用户会话无效，请重新登录')
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Supabase 查询错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        })

        // 如果是权限错误，提供用户友好的提示
        if (error.code === 'PGRST301' || error.code?.includes('permission')) {
          console.error('权限错误: 用户可能没有访问对话的权限')
          // 尝试重新获取用户认证状态
          const { data: session } = await supabase.auth.getSession()
          console.log('当前session状态:', !!session)
          if (!session) {
            console.error('用户未登录，需要重新认证')
            return []
          }
        }

        // 不抛出错误，而是设置空对话列表
        console.warn('设置空对话列表，避免应用崩溃')
        setConversations([])
        setShowWelcome(true)
        setCurrentConversation(null)
        setMessages([])
        return []
      }

      const convs = data || []
      console.log('成功加载对话列表，数量:', convs.length)
      setConversations(convs)

      // 只有在没有对话时才显示欢迎界面
      if (convs.length === 0) {
        setShowWelcome(true)
        setCurrentConversation(null)
        setMessages([])
      }
      // 不改变当前状态，让用户继续在对话页面

      return convs
    } catch (error) {
      console.error('加载对话列表时发生错误:', error)
      setConversations([])
      setShowWelcome(true)
      setCurrentConversation(null)
      setMessages([])
      return []
    }
  }, [user, isAuthenticated])

  // 优化版：加载特定对话的消息
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) {
      console.error('加载对话失败: 用户或对话ID不存在', { user: !!user, conversationId })
      return
    }

    // 设置切换对话状态
    setIsSwitchingConversation(true)

    try {
      // 1. 优先从缓存获取对话信息
      let conversation: Conversation | null = null
      const cachedConversation = conversationCache.get(conversationId)

      if (cachedConversation && (Date.now() - cachedConversation.timestamp < cachedConversation.ttl)) {
        conversation = cachedConversation.conversation
        console.log('✅ 从缓存加载对话信息:', conversation.title)
      } else {
        // 从数据库加载对话信息
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single()

        if (convError) {
          console.error('获取对话信息失败:', convError)
          throw convError
        }

        conversation = convData
        // 更新缓存
        conversationCache.set(conversationId, {
          conversation: convData,
          timestamp: Date.now(),
          ttl: CACHE_CONFIG.CONVERSATION_TTL,
        })
        console.log('✅ 从数据库加载对话信息:', conversation.title)
      }

      // 2. 加载消息（优先缓存）
      const cachedMessages = messageCache.get(conversationId)

      if (cachedMessages && (Date.now() - cachedMessages.timestamp < cachedMessages.ttl)) {
        setMessages(cachedMessages.messages)
        console.log('✅ 从缓存加载消息:', cachedMessages.messages.length, '条')
        setShouldScrollToBottom(true)
      } else {
        // 从数据库加载消息，但只加载最新的50条以提高性能
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // 限制加载数量

        if (error) {
          console.error('加载消息失败:', error)
          throw error
        }

        const messages = (msgs || []).reverse() // 重新排序为升序
        console.log('✅ 从数据库加载消息:', messages.length, '条')

        // 更新缓存
        messageCache.set(conversationId, {
          messages,
          timestamp: Date.now(),
          ttl: CACHE_CONFIG.MESSAGE_TTL,
        })

        setMessages(messages)
        setShouldScrollToBottom(true)
      }

      // 3. 更新状态
      setCurrentConversation(conversation)
      // 用户主动点击对话时，跳转到对话页面
      setShowWelcome(false)

      console.log('✅ 对话加载完成')
    } catch (error) {
      console.error('加载对话时发生错误:', error)
      showToast('加载对话失败，请重试', 'error')
    } finally {
      setIsSwitchingConversation(false)
    }
  }, [user, showToast, setIsSwitchingConversation])

  // 数据预加载逻辑 - 预加载前3个对话的消息
  const preloadConversations = useCallback(async (conversations: Conversation[]) => {
    if (!user || conversations.length === 0) { return }

    _setIsPreloading(true)
    console.log('🚀 开始预加载对话数据...')

    try {
      // 只预加载前3个对话的消息（避免过度加载）
      const topConversations = conversations.slice(0, 3)

      for (const conv of topConversations) {
        try {
          // 检查是否已缓存
          const cachedMessages = messageCache.get(conv.id)
          if (cachedMessages) {
            console.log(`✅ 对话 ${conv.title} 已缓存，跳过预加载`)
            continue
          }

          // 异步预加载消息（不阻塞UI）
          console.log(`🔍 预加载对话: ${conv.title}`)
          const { data: msgs, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30) // 预加载最近30条消息

          if (!error && msgs) {
            const messages = msgs.reverse()
            messageCache.set(conv.id, {
              messages,
              timestamp: Date.now(),
              ttl: CACHE_CONFIG.MESSAGE_TTL,
            })
            console.log(`✅ 预加载完成: ${conv.title} (${messages.length}条消息)`)
          }
        } catch (error) {
          console.warn(`预加载对话 ${conv.title} 失败:`, error)
        }

        // 每个对话之间添加小延迟，避免同时发送太多请求
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('预加载失败:', error)
    } finally {
      _setIsPreloading(false)
      console.log('🎯 预加载完成')
    }
  }, [user])

  // 检测移动端屏幕大小
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // 移动端默认收起侧边栏
      if (mobile && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 初始化时加载对话列表
  useEffect(() => {
    if (isAuthenticated && user) {
      const initializeApp = async () => {
        const loadedConversations = await loadConversations()

        // 异步预加载其他对话（不显示欢迎界面）
        if (loadedConversations.length > 0) {
          preloadConversations(loadedConversations)
        }
        // 不再自动恢复上次对话，始终显示欢迎界面
      }

      initializeApp()
    }
  }, [isAuthenticated, user, loadConversations, preloadConversations])

  // 保存当前对话ID到localStorage
  useEffect(() => {
    if (currentConversation?.id && user) {
      localStorage.setItem(`lastConversation_${user.id}`, currentConversation.id)
    }
  }, [currentConversation, user])

  // 高性能消息保存 - 批量处理和优化缓存
  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    if (!user || !currentConversation) { return null }

    try {
      // 直接保存到数据库，不创建临时消息
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          conversation_id: currentConversation.id,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('保存消息失败:', error)
        return null
      }

      if (data && currentConversation.id) {
        // 更新缓存
        const cachedMessages = messageCache.get(currentConversation.id)
        if (cachedMessages) {
          const updatedMessages = [...cachedMessages.messages, data]
          messageCache.set(currentConversation.id, {
            messages: updatedMessages,
            timestamp: Date.now(),
            ttl: CACHE_CONFIG.MESSAGE_TTL,
          })
        }

        return data
      }

      return null
    } catch (error) {
      console.error('保存消息失败:', error)
      return null
    }
  }, [user, currentConversation])

  // 更新对话标题
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    if (!user) { return }

    try {
      console.log('=== 开始更新对话标题 ===')
      console.log('对话ID:', conversationId)
      console.log('对话ID类型:', typeof conversationId)
      console.log('新标题:', newTitle)
      console.log('当前用户:', user)

      // 验证 conversationId 参数
      if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
        console.error('无效的对话ID:', conversationId)
        throw new Error('无效的对话ID，无法更新标题')
      }

      // 尝试多种方法获取认证信息
      let session = null

      // 方法1: 使用 supabase.auth.getSession()
      try {
        const result = await supabase.auth.getSession()
        session = result.data.session
        console.log('方法1获取session:', session ? '成功' : '失败')
      } catch (err) {
        console.log('方法1获取session失败:', err)
      }

      // 方法2: 如果方法1失败，尝试 getCurrentUser
      if (!session) {
        try {
          const { getCurrentUser } = await import('@/lib/auth')
          const userResult = await getCurrentUser()
          if (userResult && userResult.session) {
            session = userResult.session
            console.log('方法2获取session成功')
          }
        } catch (err) {
          console.log('方法2获取session失败:', err)
        }
      }

      let response: Response
      const titleToSave = newTitle.length > 50 ? `${newTitle.slice(0, 50)}...` : newTitle

      // 方法3: 如果有session，使用Bearer token认证
      if (session) {
        console.log('使用Bearer token认证更新标题')
        response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: titleToSave,
          }),
        })
      } else {
        // 方法4: 直接使用用户ID认证
        console.log('使用用户ID作为认证更新标题')
        response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id,
            'X-User-Email': user.email || '',
          },
          body: JSON.stringify({
            title: titleToSave,
          }),
        })
      }

      if (!response.ok) {
        let errorMessage = `更新失败: ${response.status}`
        let errorDetails = ''

        try {
          const errorText = await response.text()
          console.error('错误响应内容:', errorText)
          if (errorText) {
            const errorData = JSON.parse(errorText)

            // 根据错误代码提供更准确的错误信息
            switch (errorData.code) {
              case 'CONVERSATION_NOT_FOUND':
                errorMessage = '对话不存在'
                break
              case 'PERMISSION_DENIED':
                errorMessage = '无权更新此对话'
                break
              case 'DATABASE_ERROR':
                errorMessage = '数据库操作失败'
                errorDetails = errorData.details || ''
                break
              case 'INVALID_CONVERSATION_ID':
                errorMessage = '无效的对话ID，请刷新页面重试'
                break
              default:
                errorMessage = errorData.error || errorMessage
            }

            if (errorDetails) {
              errorMessage += ` (${errorDetails})`
            }
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError)
        }
        throw new Error(errorMessage)
      }

      // 安全解析成功响应
      let result
      try {
        const responseText = await response.text()
        console.log('成功响应内容:', responseText)
        result = responseText ? JSON.parse(responseText) : { success: true }
      } catch (parseError) {
        console.error('解析成功响应失败:', parseError)
        result = { success: true, message: '更新成功' }
      }

      console.log('对话标题更新成功:', result)

      // 更新本地状态
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, title: titleToSave, updated_at: new Date().toISOString() }
          : conv,
      ))

      // 如果是当前对话，也更新当前对话状态
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title: titleToSave } : null)
      }

      showToast('对话标题已更新', 'success')
    } catch (error) {
      console.error('更新对话标题失败:', error)
      const errorMessage = error instanceof Error ? error.message : '更新对话标题失败'
      showToast(`更新失败: ${errorMessage}`, 'error')
    }
  }, [user, currentConversation, showToast])

  // 优化：当对话更新时，刷新相关缓存
  const _refreshConversationCache = useCallback(async (conversationId: string) => {
    if (!user) { return }

    try {
      // 重新获取对话信息
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (!convError && conversation) {
        conversationCache.set(conversationId, conversation)

        // 如果是当前对话，更新状态
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(conversation)
        }
      }
    } catch (error) {
      console.warn(`刷新对话 ${conversationId} 缓存失败:`, error)
    }
  }, [user, currentConversation])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content || typeof content !== 'string' || !content.trim() || isLoading || !user) {
      showToast('请先登录', 'warning')
      return
    }

    // 如果没有当前对话，创建一个新对话
    let targetConversation = currentConversation
    if (!targetConversation) {
      // 直接创建对话，避免循环依赖
      if (!user) {
        showToast('请先登录', 'warning')
        return
      }

      try {
        const conversationData = {
          user_id: user.id,
          title: content.trim().length > 50 ? `${content.trim().slice(0, 50)}...` : content.trim(),
          status: 'active',
        }

        const { data, error } = await supabase
          .from('conversations')
          .insert([conversationData])
          .select()
          .single()

        if (error || !data) {
          console.error('创建对话失败:', error)
          showToast('创建对话失败', 'error')
          return
        }

        targetConversation = data
        setCurrentConversation(data)
        setMessages([])
        setShouldScrollToBottom(true)
        // 发送消息时才跳转到对话页面
        setShowWelcome(false)

        console.log('新创建的对话:', targetConversation)
        console.log('新对话ID:', targetConversation.id)
        console.log('新对话ID类型:', typeof targetConversation.id)
      } catch (error) {
        console.error('创建对话失败:', error)
        showToast('创建对话失败', 'error')
        return
      }
    }

    // 如果当前对话标题是默认的"新对话"，自动更新为用户的问题
    if (targetConversation.title === '新对话') {
      console.log('准备更新对话标题，对话ID:', targetConversation.id)
      await updateConversationTitle(targetConversation.id, content.trim())
      // 本地更新对话标题，不重新加载整个列表
      const newTitle = content.trim().length > 50 ? `${content.trim().substring(0, 50)}...` : content.trim()
      setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)
      setConversations(prev => prev.map(conv =>
        conv.id === targetConversation.id
          ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
          : conv,
      ))
    }

    setIsLoading(true)
    setIsStreaming(true)

    // 声明临时消息变量，确保在整个函数范围内可访问
    let tempAiMessage: ChatMessage | null = null

    try {
      // 先保存用户消息到数据库，避免重复显示
      const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        content: content.trim(),
        role: 'user',
        updated_at: new Date().toISOString(),
      }

      // 先保存用户消息，获取数据库ID
      const savedUserMessage = await saveMessage(userMessage)
      if (!savedUserMessage) {
        throw new Error('保存用户消息失败')
      }

      // 创建临时AI消息用于流式显示
      tempAiMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        loading: true,
      }

      // 只显示用户消息和临时AI消息（避免重复）
      setMessages(prev => [...prev, savedUserMessage, tempAiMessage])
      setShouldScrollToBottom(true)

      // 调用Dify API进行流式聊天
      const response = await fetch('/api/dify/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversation_id: targetConversation.dify_conversation_id,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        // 尝试获取详细的错误信息
        let errorMessage = `API调用失败: ${response.status}`
        try {
          const errorText = await response.text()
          console.error('API错误响应:', errorText)
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText)
              errorMessage += ` - ${errorData.error || errorData.message || errorData.details || '未知错误'}`
            } catch {
              errorMessage += ` - ${errorText.substring(0, 200)}`
            }
          }
        } catch (e) {
          console.error('获取错误信息失败:', e)
        }
        throw new Error(errorMessage)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''
      let conversationId = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('流读取完成，退出循环')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)

              if (data === '[DONE]') {
                // 流结束
                console.log('收到[DONE]标记，设置loading为false')

                // 确保临时消息被更新
                if (tempAiMessage) {
                  setMessages((prev) => {
                    const updated = prev.map(msg =>
                      msg.id === tempAiMessage.id
                        ? { ...msg, loading: false }
                        : msg,
                    )
                    console.log('流结束时更新消息，加载中的消息数量:', updated.filter(m => m.loading).length)
                    return updated
                  })
                  // 立即清除临时消息引用，防止后续引用
                  tempAiMessage = null
                }
                break
              }

              try {
                const parsed = JSON.parse(data)

                if (parsed.answer) {
                  aiResponse += parsed.answer

                  // 更新临时消息的内容
                  setMessages(prev => prev.map(msg =>
                    msg.id === tempAiMessage?.id
                      ? { ...msg, content: aiResponse }
                      : msg,
                  ))
                  setShouldScrollToBottom(true)
                }

                if (parsed.conversation_id) { conversationId = parsed.conversation_id }
              } catch (e) {
                console.error('解析流式数据失败:', e)
              }
            }
          }
        }
      }

      // 如果流已经结束但消息仍然处于加载状态，强制更新
      if (tempAiMessage && tempAiMessage.loading) {
        console.log('流结束后强制重置消息加载状态')
        setMessages(prev => prev.map(msg =>
          msg.id === tempAiMessage?.id
            ? { ...msg, loading: false }
            : msg,
        ))
      }

      // 保存AI响应到数据库
      console.log('AI响应长度:', aiResponse.trim().length)
      console.log('临时消息ID:', tempAiMessage?.id)

      if (aiResponse.trim()) {
        const aiMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
          content: aiResponse.trim(),
          role: 'assistant',
          updated_at: new Date().toISOString(),
        }

        const savedAiMessage = await saveMessage(aiMessage)
        if (savedAiMessage) {
          console.log('消息已保存，ID:', savedAiMessage.id)
          // 替换临时消息为保存的消息
          setMessages((prev) => {
            const updated = prev.map(msg =>
              msg.id === tempAiMessage?.id ? savedAiMessage : msg,
            )
            console.log('消息列表更新，加载中的消息数量:', updated.filter(m => m.loading).length)
            return updated
          })

          tempAiMessage = null
        }
      } else {
        // 如果没有响应内容，也要清除临时消息
        console.log('AI响应为空，清除临时消息')
        if (tempAiMessage) {
          setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id))
          tempAiMessage = null
        }
      }

      // 如果有新的Dify对话ID，更新对话记录
      if (conversationId && conversationId !== targetConversation.dify_conversation_id) {
        await supabase
          .from('conversations')
          .update({ dify_conversation_id: conversationId })
          .eq('id', targetConversation.id)

        // 更新当前对话状态
        setCurrentConversation(prev => prev
          ? {
            ...prev,
            dify_conversation_id: conversationId,
          }
          : null)
      }

      // 只更新当前对话的时间戳，不重新加载整个对话列表
      if (currentConversation) {
        setCurrentConversation(prev => prev
          ? {
            ...prev,
            updated_at: new Date().toISOString(),
          }
          : null)

        // 更新对话列表中的时间戳
        setConversations(prev => prev.map(conv =>
          conv.id === currentConversation.id
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv,
        ))
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showToast('发送消息失败，请重试', 'error')

      // 移除临时消息和可能重复的用户消息
      setMessages(prev => prev.filter((msg) => {
        // 保留已经保存的用户消息（通过ID判断），移除临时消息
        return !msg.id.startsWith('temp-') && !(msg.role === 'user' && msg.content === content.trim() && !msg.id.startsWith('temp-'))
      }))
    } finally {
      // 确保所有临时消息都被清除
      if (tempAiMessage) {
        console.log('finally块中清除临时消息:', tempAiMessage.id)
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== tempAiMessage.id)
          console.log('清除临时消息后的消息列表长度:', filtered.length)
          return filtered
        })
      }

      // 确保加载状态被重置
      console.log('finally块中重置加载状态')
      setIsLoading(false)
      setIsStreaming(false)

      // 确保没有消息处于加载状态
      setMessages((prev) => {
        const updated = prev.map(msg =>
          msg.loading ? { ...msg, loading: false } : msg,
        )
        if (prev.some(m => m.loading) && !updated.some(m => m.loading)) {
          console.log('在finally块中清除了所有加载状态')
        }
        return updated
      })
    }
  }, [user, currentConversation, isLoading, saveMessage, updateConversationTitle, showToast])

  // 为特定对话发送消息 - 用于快速开始功能，避免依赖currentConversation状态
  const sendMessageForConversation = useCallback(async (conversation: Conversation, content: string) => {
    if (!content || typeof content !== 'string' || !content.trim() || isLoading || !user) {
      showToast('请先登录', 'warning')
      return
    }

    setIsLoading(true)
    setIsStreaming(true)

    // 声明临时消息变量，确保在整个函数范围内可访问
    let tempAiMessage: ChatMessage | null = null

    try {
      // 先保存用户消息到数据库
      const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        content: content.trim(),
        role: 'user',
        updated_at: new Date().toISOString(),
      }

      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          ...userMessage,
          conversation_id: conversation.id,
          user_id: user.id,
        })
        .select()
        .single()

      if (userMessageError || !savedUserMessage) {
        throw new Error('保存用户消息失败')
      }

      // 创建临时AI消息用于流式显示
      tempAiMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        loading: true,
      }

      // 显示消息
      setMessages([savedUserMessage, tempAiMessage])
      setShouldScrollToBottom(true)

      // 调用Dify API进行流式聊天
      const response = await fetch('/api/dify/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversation_id: conversation.dify_conversation_id,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        let errorMessage = `API调用失败: ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText)
              errorMessage += ` - ${errorData.error || errorData.message || errorData.details || '未知错误'}`
            } catch {
              errorMessage += ` - ${errorText.substring(0, 200)}`
            }
          }
        } catch (e) {
          console.error('获取错误信息失败:', e)
        }
        throw new Error(errorMessage)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''
      let difyConversationId = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('流读取完成，退出循环')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)

              if (data === '[DONE]') {
                // 流结束
                console.log('收到[DONE]标记，设置loading为false')

                if (tempAiMessage) {
                  setMessages((prev) => {
                    const updated = prev.map(msg =>
                      msg.id === tempAiMessage.id
                        ? { ...msg, loading: false }
                        : msg,
                    )
                    return updated
                  })
                  tempAiMessage = null
                }
                break
              }

              try {
                const parsed = JSON.parse(data)

                if (parsed.answer) {
                  aiResponse += parsed.answer

                  // 更新临时消息的内容
                  setMessages(prev => prev.map(msg =>
                    msg.id === tempAiMessage?.id
                      ? { ...msg, content: aiResponse }
                      : msg,
                  ))
                  setShouldScrollToBottom(true)
                }

                if (parsed.conversation_id) {
                  difyConversationId = parsed.conversation_id
                }
              } catch (e) {
                console.error('解析流式数据失败:', e)
              }
            }
          }
        }
      }

      // 保存AI响应到数据库
      if (aiResponse.trim()) {
        const aiMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
          content: aiResponse.trim(),
          role: 'assistant',
          updated_at: new Date().toISOString(),
        }

        const { data: savedAiMessage, error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            ...aiMessage,
            conversation_id: conversation.id,
            user_id: user.id,
          })
          .select()
          .single()

        if (!aiMessageError && savedAiMessage) {
          // 替换临时消息为保存的消息
          setMessages((prev) => {
            const updated = prev.map(msg =>
              msg.id === tempAiMessage?.id ? savedAiMessage : msg,
            )
            return updated
          })
          tempAiMessage = null
        }
      } else {
        // 如果没有响应内容，清除临时消息
        if (tempAiMessage) {
          setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id))
          tempAiMessage = null
        }
      }

      // 如果有新的Dify对话ID，更新对话记录
      if (difyConversationId && difyConversationId !== conversation.dify_conversation_id) {
        await supabase
          .from('conversations')
          .update({ dify_conversation_id: difyConversationId })
          .eq('id', conversation.id)

        // 更新当前对话状态
        setCurrentConversation(prev => prev
          ? {
            ...prev,
            dify_conversation_id: difyConversationId,
          }
          : null)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showToast('发送消息失败，请重试', 'error')

      // 移除临时消息
      setMessages(prev => prev.filter((msg) => {
        return !msg.id.startsWith('temp-') && !(msg.role === 'user' && msg.content === content.trim() && !msg.id.startsWith('temp-'))
      }))
    } finally {
      // 确保所有临时消息都被清除
      if (tempAiMessage) {
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== tempAiMessage.id)
          return filtered
        })
      }

      // 确保加载状态被重置
      setIsLoading(false)
      setIsStreaming(false)

      // 确保没有消息处于加载状态
      setMessages((prev) => {
        const updated = prev.map(msg =>
          msg.loading ? { ...msg, loading: false } : msg,
        )
        return updated
      })
    }
  }, [user, isLoading, showToast, setCurrentConversation])

  // 创建带标题的新对话
  const createNewConversationWithTitle = useCallback(async (title: string, presetQuestion?: string) => {
    if (!user) {
      console.error('创建对话失败: 用户不存在')
      return null
    }

    try {
      const conversationData = {
        user_id: user.id,
        title: title.length > 50 ? `${title.slice(0, 50)}...` : title,
        status: 'active',
      }

      console.log('正在创建对话，数据:', conversationData)

      const { data, error } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single()

      if (error) {
        console.error('创建对话失败:', error)
        showToast('创建对话失败', 'error')
        return null
      }

      console.log('对话创建成功:', data)

      // 设置为当前对话
      setCurrentConversation(data)
      setMessages([])
      setShouldScrollToBottom(true)
      // 创建带预设问题的对话时才跳转
      if (presetQuestion) {
        setShowWelcome(false)
      }

      // 更新对话列表，将新对话添加到列表开头
      setConversations(prev => [data, ...prev])

      // 如果有预设问题，直接发送消息（不使用setTimeout避免时序问题）
      if (presetQuestion) {
        try {
          // 使用新创建的对话直接发送消息，避免依赖currentConversation状态
          await sendMessageForConversation(data, presetQuestion)
        } catch (error) {
          console.error('发送预设问题失败:', error)
          showToast('发送预设问题失败，请重试', 'error')
        }
      }

      return data
    } catch (error) {
      console.error('创建对话失败 - 完整错误信息:', error)
      if (error instanceof Error) {
        console.error('错误名称:', error.name)
        console.error('错误消息:', error.message)
        console.error('错误堆栈:', error.stack)
      } else {
        console.error('非标准错误对象:', typeof error, error)
      }
      return null
    }
  }, [user, showToast, sendMessageForConversation])

  // 创建带标题的新对话
  const createNewConversationWithPreset = useCallback(async (_presetQuestion?: string) => {
    const title = _presetQuestion && typeof _presetQuestion === 'string'
      ? _presetQuestion.substring(0, 50) + (_presetQuestion.length > 50 ? '...' : '')
      : '新对话'
    return await createNewConversationWithTitle(title, _presetQuestion)
  }, [createNewConversationWithTitle])

  // 创建新对话
  const createNewConversation = useCallback(async () => {
    const result = await createNewConversationWithTitle('新对话')
    // 主动点击新建对话时，跳转到空白页面
    if (result) {
      setShowWelcome(false)
    }
    return result
  }, [createNewConversationWithTitle])

  // 开始编辑对话标题
  const startEditingTitle = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId)
    setEditingTitle(currentTitle)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  // 保存编辑
  const saveEditing = (conversationId: string) => {
    if (editingTitle.trim()) {
      updateConversationTitle(conversationId, editingTitle.trim())
    } else {
      cancelEditing()
    }
  }

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    // 检查用户认证状态
    if (!user || !isAuthenticated) {
      console.error('用户未认证，无法删除对话')
      throw new Error('用户未认证，请重新登录')
    }

    // 验证用户信息完整性
    if (!user.id || !user.email) {
      console.error('用户信息不完整:', user)
      throw new Error('用户信息不完整，请重新登录')
    }

    // 增强验证 conversationId 参数
    if (!conversationId
      || typeof conversationId !== 'string'
      || conversationId === 'undefined'
      || conversationId === 'null'
      || conversationId.trim() === '') {
      console.error('无效的对话ID:', conversationId, '类型:', typeof conversationId)
      throw new Error('无效的对话ID，无法删除')
    }

    // 验证ID格式（应该是UUID格式）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(conversationId)) {
      console.error('对话ID格式无效:', conversationId)
      throw new Error('对话ID格式无效')
    }

    console.log('开始删除对话，用户:', user.email, '对话ID:', conversationId)

    try {
      console.log('正在删除对话:', conversationId)
      console.log('当前用户:', user)

      let response: Response
      let result: any

      // 尝试获取session，如果失败则直接使用用户信息认证
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session && session.access_token) {
          console.log('使用Bearer token认证')
          response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
        } else {
          throw new Error('No valid session')
        }
      } catch (sessionError) {
        console.log('获取session失败，使用用户信息认证:', sessionError)

        // 直接使用用户信息认证（备用方案）
        if (!user.id || !user.email) {
          throw new Error('用户信息不完整，无法进行认证')
        }

        response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id,
            'X-User-Email': user.email,
          },
        })
      }

      if (!response.ok) {
        let errorMessage = `删除失败: ${response.status}`
        let errorDetails = ''

        try {
          const errorText = await response.text()
          console.error('错误响应内容:', errorText)
          if (errorText) {
            const errorData = JSON.parse(errorText)

            // 根据错误代码提供更准确的错误信息
            switch (errorData.code) {
              case 'CONVERSATION_NOT_FOUND':
                errorMessage = '对话不存在'
                // 如果对话不存在，仍然从本地列表中移除
                setConversations(prev => prev.filter(conv => conv.id !== conversationId))
                // 在主页面删除时，不触发任何状态变化
                return true // 认为删除成功，因为对话已经不存在
                break
              case 'PERMISSION_DENIED':
                errorMessage = '无权删除此对话'
                break
              case 'DATABASE_ERROR':
                errorMessage = '数据库操作失败'
                errorDetails = errorData.details || ''
                break
              case 'INVALID_CONVERSATION_ID':
                errorMessage = '无效的对话ID，请刷新页面重试'
                break
              default:
                errorMessage = errorData.error || errorMessage
            }

            if (errorDetails) {
              errorMessage += ` (${errorDetails})`
            }
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError)
        }
        throw new Error(errorMessage)
      }

      // 安全解析成功响应
      try {
        const responseText = await response.text()
        console.log('成功响应内容:', responseText)
        result = responseText ? JSON.parse(responseText) : { success: true }
      } catch (parseError) {
        console.error('解析成功响应失败:', parseError)
        result = { success: true, message: '删除成功' }
      }

      console.log('对话删除成功:', result)

      // 简化逻辑：无论在哪里删除，都只从对话列表中移除
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      // 如果删除的是当前对话，或者没有对话时，跳转到AI-chat主界面
      if (currentConversation?.id === conversationId || conversations.length <= 1) {
        setCurrentConversation(null)
        setMessages([])
        setShowWelcome(true)
      }

      // 后台重新加载对话列表确保数据同步
      loadConversations().catch(console.error)

      return true
    } catch (error) {
      console.error('删除对话失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除对话失败'
      throw new Error(errorMessage)
    }
  }, [user, isAuthenticated, currentConversation, loadConversations, conversations.length])

  // 批量删除所有对话
  const deleteAllConversations = useCallback(async () => {
    if (!user || conversations.length === 0) {
      return
    }

    // 显示确认对话框
    setConfirmDialog({
      isOpen: true,
      title: '批量删除确认',
      message: `确定要删除所有 ${conversations.length} 个对话吗？此操作不可撤销！`,
      onConfirm: async () => {
        try {
          console.log('正在批量删除对话:', conversations.map(c => c.id))
          console.log('当前用户:', user)

          // 尝试多种方法获取认证信息
          let session = null

          // 方法1: 使用 supabase.auth.getSession()
          try {
            const result = await supabase.auth.getSession()
            session = result.data.session
            console.log('方法1获取session:', session ? '成功' : '失败')
          } catch (err) {
            console.log('方法1获取session失败:', err)
          }

          // 方法2: 如果方法1失败，尝试 getCurrentUser
          if (!session) {
            try {
              const { getCurrentUser } = await import('@/lib/auth')
              const userResult = await getCurrentUser()
              if (userResult && userResult.session) {
                session = userResult.session
                console.log('方法2获取session成功')
              }
            } catch (err) {
              console.log('方法2获取session失败:', err)
            }
          }

          // 使用获取到的session或用户ID进行认证
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`
            console.log('使用Bearer token认证')
          } else {
            headers['X-User-ID'] = user.id
            headers['X-User-Email'] = user.email || ''
            console.log('使用X-User-ID认证')
          }

          const response = await fetch('/api/conversations/batch-delete', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              conversation_ids: conversations.map(c => c.id),
            }),
          })

          if (!response.ok) {
            let errorMessage = `批量删除失败: ${response.status}`
            try {
              const errorText = await response.text()
              console.error('错误响应内容:', errorText)
              if (errorText) {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.error || errorMessage
              }
            } catch (parseError) {
              console.error('解析错误响应失败:', parseError)
            }
            throw new Error(errorMessage)
          }

          // 安全解析成功响应
          let result
          try {
            const responseText = await response.text()
            console.log('成功响应内容:', responseText)
            result = responseText ? JSON.parse(responseText) : { deleted_count: 0 }
          } catch (parseError) {
            console.error('解析成功响应失败:', parseError)
            result = { deleted_count: conversations.length, message: '删除成功' }
          }

          console.log('批量删除对话成功:', result)

          // 清空当前状态并显示欢迎界面
          setCurrentConversation(null)
          setMessages([])
          setShowWelcome(true)

          // 立即清空本地对话列表
          setConversations([])

          // 后台重新加载对话列表确保数据同步
          loadConversations().catch(console.error)

          // 删除成功后自动关闭弹窗，不再显示alert
          setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
        } catch (error) {
          console.error('批量删除对话失败:', error)
          // 删除失败时也直接关闭弹窗，不显示错误信息
          setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
        }
      },
      type: 'danger',
    })
  }, [user, conversations, loadConversations])

  // 停止生成
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    setIsStreaming(false)
  }, [])

  // 渲染对话列表
  const renderConversationList = () => {
    // 过滤掉无效的对话
    const validConversations = conversations.filter((conv) => {
      if (!conv.id) {
        console.error('对话缺少id字段:', conv)
        return false
      }
      if (typeof conv.id !== 'string') {
        console.error('对话id类型无效:', conv.id, typeof conv.id, conv)
        return false
      }
      if (conv.id === 'undefined' || conv.id === 'null' || conv.id.trim() === '') {
        console.error('对话id值无效:', conv.id, conv)
        return false
      }
      if (!conv.title || typeof conv.title !== 'string' || conv.title.trim() === '') {
        console.error('对话标题无效:', conv.title, conv)
        return false
      }
      return true
    })

    // 如果过滤后没有有效对话，显示提示
    if (validConversations.length === 0) {
      return <p className="text-gray-500 text-sm">暂无对话</p>
    }

    return validConversations.map((conv) => {
      // 详细验证对话数据完整性
      console.log('检查对话数据:', conv)

      // 如果侧边栏收起，显示简化版本
      if (isSidebarCollapsed) {
        return (
          <div
            key={conv.id}
            className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
              currentConversation?.id === conv.id
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50'
            } ${isSwitchingConversation && currentConversation?.id === conv.id ? 'opacity-75' : ''}`}
            onClick={() => {
              loadConversation(conv.id)
              setIsSidebarCollapsed(false)
            }}
            title={conv.title}
          >
            <div className="flex items-center justify-center">
              {currentConversation?.id === conv.id
                ? (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )
                : (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">💬</span>
                  </div>
                )}
            </div>
          </div>
        )
      }

      return (
        <div
          key={conv.id}
          className={`relative p-3 rounded-lg hover:bg-gray-100 transition-colors ${
            currentConversation?.id === conv.id
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-gray-50'
          } ${isSwitchingConversation && currentConversation?.id === conv.id ? 'opacity-75' : ''}`}
        >
          {/* 对话内容区域 */}
          <div
            onClick={() => loadConversation(conv.id)}
            className="cursor-pointer pr-16"
          >
            {/* 切换中的加载指示器 */}
            {isSwitchingConversation && currentConversation?.id === conv.id && (
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600">加载中...</span>
              </div>
            )}
            {editingConversationId === conv.id
              ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEditing(conv.id)
                      } else if (e.key === 'Escape') {
                        cancelEditing()
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    maxLength={50}
                  />
                </div>
              )
              : (
                <>
                  <div className="font-medium text-sm truncate">{conv.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(conv.updated_at || conv.created_at || '').toLocaleString()}
                  </div>
                </>
              )}
          </div>

          {/* 操作按钮区域 */}
          <div className="absolute top-2 right-2 flex space-x-1">
            {editingConversationId === conv.id
              ? (
                <>
                  {/* 保存按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveEditing(conv.id)
                    }}
                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                    title="保存"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  {/* 取消按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cancelEditing()
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                    title="取消"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )
              : (
                <>
                  {/* 编辑按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingTitle(conv.id, conv.title)
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑标题"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()

                      // 在显示删除确认之前验证对话ID
                      if (!conv.id || typeof conv.id !== 'string' || conv.id.trim() === '') {
                        console.error('无法删除对话：对话ID无效', conv)
                        showToast('删除失败：对话ID无效', 'error')
                        return
                      }

                      setConfirmDialog({
                        isOpen: true,
                        title: '删除对话',
                        message: `确定要删除对话"${conv.title}"吗？此操作不可撤销！`,
                        onConfirm: async () => {
                          try {
                            console.log('🔍 删除前检查对话数据:', conv)

                            // 再次验证ID
                            if (!conv.id || typeof conv.id !== 'string' || conv.id.trim() === '') {
                              console.error('❌ 对话ID无效:', conv.id)
                              throw new Error('对话ID无效，无法删除')
                            }

                            console.log('🗑️ 开始删除对话，ID:', conv.id, '类型:', typeof conv.id)
                            const result = await deleteConversation(conv.id)
                            console.log('✅ 删除结果:', result)

                            // 删除成功后自动关闭弹窗
                            setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
                          } catch (error) {
                            // 删除失败时显示具体错误信息
                            const errorMessage = error instanceof Error ? error.message : '删除对话失败'
                            console.error('❌ 删除对话失败:', error)
                            showToast(`删除失败: ${errorMessage}`, 'error')
                            setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })
                          }
                        },
                        type: 'danger',
                      })
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除对话"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
          </div>
        </div>
      )
    })
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

    // 调试：检查是否有加载中的消息
    const loadingMessages = messages.filter(m => m.loading)
    if (loadingMessages.length > 0) {
      console.log('渲染消息时发现加载中的消息:', loadingMessages.map(m => ({ id: m.id, content: m.content.substring(0, 20) })))
    }

    return messages.map((msg, index) => (
      <div key={`${msg.id}-${index}`} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
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
          {msg.loading && (
            <span className="inline-flex items-center ml-2" title="AI正在生成回复...">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            </span>
          )}
          {msg.role === 'user' && (
            <div className="text-xs text-blue-100 mt-2 text-right">用户</div>
          )}
        </div>
      </div>
    ))
  }

  // 显示加载状态
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载用户信息...</p>
        </div>
      </div>
    )
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
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            请登录
          </button>
        </div>
      </div>
    )
  }

  // 如果显示欢迎界面，返回欢迎屏幕
  if (showWelcome) {
    return (
      <>
        {/* 确认对话框 - 放在根级别确保在所有界面都能显示 */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
          type={confirmDialog.type}
        />

        {/* Toast 通知 */}
        {toast.show && (
          <div
            className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
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

        <div className="flex h-screen bg-gray-50 relative">
          {/* 移动端侧边栏遮罩层 */}
          {isMobile && !isSidebarCollapsed && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsSidebarCollapsed(true)}
            />
          )}

          {/* 全局顶部导航栏 */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="打开侧边栏"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                  // 返回主页面
                    window.location.href = '/'
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="返回主页面"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">劳动法智能助手</h1>
              </div>
              {/* 整个页面的右上角用户信息 */}
              <div className="text-sm text-gray-600">
                👤 {user?.name || user?.email}
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className={`
            ${isMobile
        ? `fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 w-64 ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`
        : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`
      }
            ${isMobile ? 'pt-16' : 'pt-16'}
          `}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                {!isSidebarCollapsed && <h2 className="text-lg font-semibold">对话列表</h2>}
                <div className="flex items-center space-x-2">
                  {(!isSidebarCollapsed || !isMobile) && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {isSidebarCollapsed
                  ? (
                    <>
                      <button
                        onClick={() => {
                          createNewConversation()
                          setIsSidebarCollapsed(false)
                        }}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        title="新建对话"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      {conversations.length > 0 && (
                        <button
                          onClick={deleteAllConversations}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                          title="清空所有对话"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )
                  : (
                    <>
                      <button
                        onClick={createNewConversation}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        ➕ 新建对话
                      </button>
                      {conversations.length > 0 && (
                        <button
                          onClick={deleteAllConversations}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          清空所有对话
                        </button>
                      )}
                    </>
                  )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0
                ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    {isSidebarCollapsed
                      ? (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">💬</span>
                        </div>
                      )
                      : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">💬</span>
                          </div>
                          <p className="text-sm">暂无对话历史</p>
                          <p className="text-xs mt-1">点击上方按钮开始对话</p>
                        </div>
                      )}
                  </div>
                )
                : (
                  renderConversationList()
                )}
            </div>
          </div>

          {/* 欢迎界面 */}
          <WelcomeScreen
            user={user}
            conversations={conversations}
            onStartNewChat={(presetQuestion) => {
              if (presetQuestion) {
                // 有预设问题时，创建对话并跳转
                createNewConversationWithPreset(presetQuestion)
              } else {
                // 没有预设问题时，创建空白对话并跳转
                createNewConversation()
              }
            }}
            onDeleteConversation={deleteConversation}
            onLoadConversations={loadConversations}
          />
        </div>
      </>
    )
  }

  return (
    <>
      {/* 确认对话框 - 放在根级别确保在所有界面都能显示 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
        type={confirmDialog.type}
      />

      {/* Toast 通知 */}
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
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

      <div className="flex h-screen bg-gray-50 relative">
        {/* 移动端侧边栏遮罩层 */}
        {isMobile && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* 全局顶部导航栏 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="打开侧边栏"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              {!showWelcome && (
                <>
                  <button
                    onClick={() => {
                    // 返回主页面
                      window.location.href = '/'
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="返回主页面"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setShowWelcome(true)
                      setCurrentConversation(null)
                      setMessages([])
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="返回对话主页面"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                </>
              )}
              <h1 className="text-xl font-bold">劳动法智能助手</h1>
            </div>
            {/* 整个页面的右上角用户信息 */}
            <div className="text-sm text-gray-600">
              👤 {user?.name || user?.email}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className={`
          ${isMobile
      ? `fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 w-64 ${
        isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`
      : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`
    }
          ${isMobile ? 'pt-16' : 'pt-16'}
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {!isSidebarCollapsed && <h2 className="text-lg font-semibold">对话列表</h2>}
              <div className="flex items-center space-x-2">
                {(!isSidebarCollapsed || !isMobile) && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {conversations.length}
                  </span>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {isSidebarCollapsed
                ? (
                  <>
                    <button
                      onClick={() => {
                        createNewConversation()
                        setIsSidebarCollapsed(false)
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="新建对话"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {conversations.length > 0 && (
                      <button
                        onClick={deleteAllConversations}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        title="清空所有对话"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )
                : (
                  <>
                    <button
                      onClick={createNewConversation}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      新建对话
                    </button>
                    {conversations.length > 0 && (
                      <button
                        onClick={deleteAllConversations}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        清空所有对话
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderConversationList()}
          </div>
        </div>

        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col pt-16">
          {/* 消息区域 */}
          <div
            ref={messageAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {renderMessages()}

            {(isLoading || isStreaming) && (
              <div className="flex justify-start">
                <div className="message-bubble bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">🤖</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>{isStreaming ? 'AI正在回复中...' : 'AI正在思考中...'}</span>
                      <button
                        onClick={stopStreaming}
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
                disabled={isLoading || isStreaming}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
              <button
                type="submit"
                disabled={isLoading || isStreaming}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading || isStreaming ? '发送中...' : '发送'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  )
}

export default IntegratedChat
