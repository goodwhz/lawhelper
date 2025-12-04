'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Conversation } from './types'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import WelcomeScreen from '@/app/components/ui/WelcomeScreen'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const IntegratedChat: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)

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

  // 欢迎界面状态
  const [showWelcome, setShowWelcome] = useState(false)

  // 初始化
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations()
    }
  }, [isAuthenticated, user, loadConversations])

  // 进入页面时总是显示欢迎界面
  useEffect(() => {
    if (isAuthenticated && user) {
      setShowWelcome(true)
      setCurrentConversation(null)
      setMessages([])
    }
  }, [isAuthenticated, user])

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    if (!user) {
      console.error('加载对话失败: 用户不存在')
      return
    }

    // 检查用户ID是否存在
    if (!user.id) {
      console.error('加载对话失败: 用户ID不存在', user)
      return
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
          const { data: { session } } = await supabase.auth.getSession()
          console.log('当前session状态:', !!session)
          if (!session) {
            console.error('用户未登录，需要重新认证')
            return
          }
        }

        // 不抛出错误，而是设置空对话列表
        console.warn('设置空对话列表，避免应用崩溃')
        setConversations([])
        setShowWelcome(true)
        setCurrentConversation(null)
        setMessages([])
        return
      }

      const convs = data || []
      console.log('成功加载对话列表，数量:', convs.length)

      // 详细检查每个对话的数据完整性
      convs.forEach((conv, index) => {
        console.log(`对话 ${index + 1}:`, {
          id: conv.id,
          title: conv.title,
          user_id: conv.user_id,
          hasId: !!conv.id,
          idType: typeof conv.id,
          idString: JSON.stringify(conv.id),
        })

        if (!conv.id) {
          console.error(`对话 ${index + 1} 缺少ID字段，完整数据:`, conv)
        }
      })

      setConversations(convs)

      // 总是显示欢迎界面，不自动加载对话
      console.log('对话列表加载完成，数量:', convs.length)
      setShowWelcome(true)
      setCurrentConversation(null)
      setMessages([])
    } catch (error) {
      console.error('加载对话失败 - 完整错误信息:', error)
      if (error instanceof Error) {
        console.error('错误名称:', error.name)
        console.error('错误消息:', error.message)
        console.error('错误堆栈:', error.stack)
      } else {
        console.error('非标准错误对象:', typeof error, error)
      }

      // 检查是否是认证问题
      if (error instanceof Error && error.message.includes('重新登录')) {
        // 认证问题，不设置任何状态，让用户重新登录
        console.error('用户需要重新登录')
        return
      }

      // 其他错误，设置空对话列表作为回退
      console.warn('设置空对话列表，避免应用崩溃')
      setConversations([])
      setShowWelcome(true)
      setCurrentConversation(null)
      setMessages([])
    }
  }, [user, isAuthenticated])

  // 创建新对话
  const createNewConversation = async () => {
    return await createNewConversationWithTitle('新对话')
  }

  // 创建带标题的新对话
  const createNewConversationWithPreset = useCallback(async (presetQuestion?: string) => {
    const title = presetQuestion && typeof presetQuestion === 'string'
      ? presetQuestion.substring(0, 50) + (presetQuestion.length > 50 ? '...' : '')
      : '新对话'
    return await createNewConversationWithTitle(title, presetQuestion)
  }, [createNewConversationWithTitle])

  // 创建带标题的新对话
  const createNewConversationWithTitle = async (title: string, presetQuestion?: string) => {
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
      console.log('用户信息:', { id: user.id, email: user.email })

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select('id, title, user_id, status, created_at, updated_at')
        .single()

      if (error) {
        console.error('Supabase 错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        })
        throw error
      }

      console.log('对话创建成功，完整数据:', data)
      console.log('对话ID:', data?.id)
      console.log('对话ID类型:', typeof data?.id)
      console.log('对话标题:', data?.title)

      // 验证返回的数据
      if (!data || !data.id) {
        console.error('创建对话返回的数据无效:', data)
        throw new Error('对话创建失败：返回的数据不完整')
      }

      // 隐藏欢迎界面
      setShowWelcome(false)

      // 设置为当前对话
      setCurrentConversation(data)
      setMessages([])

      // 更新本地对话列表，添加新对话到顶部
      setConversations(prev => [data, ...prev])

      // 不再重新加载对话列表，避免干扰当前对话

      // 如果有预设问题，发送消息
      if (presetQuestion) {
        setTimeout(() => {
          sendMessage(presetQuestion)
        }, 500)
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
  }

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

      const result = await response.json()
      console.log('对话标题更新成功:', result)

      // 更新本地状态
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: result.title || titleToSave, updated_at: result.updated_at || new Date().toISOString() }
            : conv,
        ),
      )

      // 如果是当前对话，也更新当前对话状态
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev =>
          prev ? { ...prev, title: result.title || titleToSave, updated_at: result.updated_at || new Date().toISOString() } : null,
        )
      }

      setEditingConversationId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('更新对话标题失败:', error)
      const errorMessage = error instanceof Error ? error.message : '更新对话标题失败'
      // 不显示弹窗，只记录错误
      console.error('标题更新错误详情:', errorMessage)
    }
  }, [user, currentConversation, setConversations, setCurrentConversation, setEditingConversationId, setEditingTitle])

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

  // 加载特定对话
  const loadConversation = async (conversationId: string) => {
    if (!user) { return }

    try {
      // 获取对话信息
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError) { throw convError }

      // 获取消息
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (msgError) { throw msgError }

      setCurrentConversation(conversation)
      setMessages(msgs || [])

      // 隐藏欢迎界面
      setShowWelcome(false)

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

  // 保存消息到数据库
  const saveMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    if (!user || !currentConversation) { return null }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          conversation_id: currentConversation.id,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) { throw error }
      return data
    } catch (error) {
      console.error('保存消息失败:', error)
      return null
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

      // 如果删除的是当前对话，清空状态并显示欢迎界面
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
        setShowWelcome(true)
      }

      // 立即从本地对话列表中移除已删除的对话
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      // 后台重新加载对话列表确保数据同步
      loadConversations().catch(console.error)

      return true
    } catch (error) {
      console.error('删除对话失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除对话失败'
      throw new Error(errorMessage)
    }
  }, [user, isAuthenticated, currentConversation, loadConversations])

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

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !user) {
      showToast('请先登录', 'warning')
      return
    }

    // 如果没有当前对话，创建一个新对话
    let targetConversation = currentConversation
    if (!targetConversation) {
      targetConversation = await createNewConversationWithTitle(content.trim())
      if (!targetConversation) {
        showToast('创建对话失败', 'error')
        return
      }

      console.log('新创建的对话:', targetConversation)
      console.log('新对话ID:', targetConversation.id)
      console.log('新对话ID类型:', typeof targetConversation.id)
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
      // 保存用户消息
      const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        content: content.trim(),
        role: 'user',
      }

      const savedUserMessage = await saveMessage(userMessage)
      if (savedUserMessage) {
        setMessages(prev => [...prev, savedUserMessage])
      }

      // 创建临时的AI消息用于流式显示
      tempAiMessage = {
        id: `temp-${Date.now()}`,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        loading: true,
      }

      setMessages(prev => [...prev, tempAiMessage])

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

      // 移除临时消息
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
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
  }, [user, currentConversation, isLoading, saveMessage, createNewConversationWithTitle, updateConversationTitle, showToast])

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
    if (conversations.length === 0) {
      return <p className="text-gray-500 text-sm">暂无对话</p>
    }

    return conversations.map((conv) => {
      // 详细验证对话数据完整性
      console.log('检查对话数据:', conv)

      if (!conv.id) {
        console.error('对话缺少id字段:', conv)
        return null // 不渲染无效对话
      }

      if (typeof conv.id !== 'string') {
        console.error('对话id类型无效:', conv.id, typeof conv.id, conv)
        return null
      }

      if (conv.id === 'undefined' || conv.id === 'null' || conv.id.trim() === '') {
        console.error('对话id值无效:', conv.id, conv)
        return null // 不渲染无效对话
      }

      return (
        <div
          key={conv.id}
          className={`relative p-3 rounded-lg hover:bg-gray-100 transition-colors ${
            currentConversation?.id === conv.id
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-gray-50'
          }`}
        >
          {/* 对话内容区域 */}
          <div
            onClick={() => loadConversation(conv.id)}
            className="cursor-pointer pr-16"
          >
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
      <div className="flex h-screen bg-gray-50">
        {/* 全局顶部导航栏 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">劳动法智能助手</h1>
            {/* 整个页面的右上角用户信息 */}
            <div className="text-sm text-gray-600">
              👤 {user?.name || user?.email}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col pt-16">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">对话列表</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {conversations.length}
              </span>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => createNewConversationWithPreset()}
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
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.length === 0
              ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">💬</span>
                    </div>
                    <p className="text-sm">暂无对话历史</p>
                    <p className="text-xs mt-1">点击上方按钮开始对话</p>
                  </div>
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
          onStartNewChat={(presetQuestion) => {
            createNewConversationWithPreset(presetQuestion)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 全局顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!showWelcome && (
              <button
                onClick={() => {
                  setShowWelcome(true)
                  setCurrentConversation(null)
                  setMessages([])
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回欢迎界面"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
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
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col pt-16">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">对话列表</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {conversations.length}
            </span>
          </div>
          <div className="space-y-2">
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

      {/* 确认对话框 */}
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
    </div>
  )
}

export default IntegratedChat
