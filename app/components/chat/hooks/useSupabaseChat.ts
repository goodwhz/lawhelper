import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ChatMessage, Conversation, ChatState, ChatActions } from '../types'
import { useSupabaseAuth } from './useSupabaseAuth'

export const useSupabaseChat = (): ChatState & ChatActions => {
  const { user } = useSupabaseAuth()
  const [state, setState] = useState<ChatState>({
    messages: [],
    currentConversation: null,
    isLoading: false,
    isStreaming: false,
    error: null,
  })

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    if (!user) return []

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data as Conversation[]
  }, [user])

  // 创建新对话
  const createNewConversation = useCallback(async (title?: string) => {
    if (!user) throw new Error('用户未登录')

    const conversationData = {
      user_id: user.id,
      title: title || '新对话',
      status: 'active',
      metadata: {},
      settings: {},
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single()

    if (error) throw error

    const newConversation = data as Conversation
    setState(prev => ({ ...prev, currentConversation: newConversation, messages: [] }))
    return newConversation
  }, [user])

  // 加载对话消息
  const loadConversation = useCallback(async (conversationId?: string) => {
    if (!user) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let targetConversation: Conversation | null = null

      if (conversationId) {
        // 加载指定对话
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single()

        if (convError) throw convError
        targetConversation = conversation as Conversation
      } else {
        // 获取最新的对话或创建新对话
        const conversations = await loadConversations()
        if (conversations.length > 0) {
          targetConversation = conversations[0]
        } else {
          targetConversation = await createNewConversation()
        }
      }

      if (targetConversation) {
        // 加载该对话的消息
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', targetConversation.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError

        setState(prev => ({
          ...prev,
          currentConversation: targetConversation,
          messages: messages as ChatMessage[],
          isLoading: false,
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载对话失败',
      }))
    }
  }, [user, loadConversations, createNewConversation])

  // 保存消息到数据库
  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !state.currentConversation) throw new Error('用户或对话不存在')

    const messageData = {
      ...message,
      conversation_id: state.currentConversation.id,
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) throw error
    return data as ChatMessage
  }, [user, state.currentConversation])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !state.currentConversation) return

    // 创建用户消息
    const userMessage: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> = {
      content,
      role: 'user',
      message_files: [],
      agent_thoughts: [],
      citation: [],
      feedback: null,
      more: {},
      annotation: null,
      is_opening_statement: false,
    }

    try {
      // 保存用户消息
      const savedUserMessage = await saveMessage(userMessage)
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, savedUserMessage],
        isStreaming: true,
      }))

      // 调用 Dify 模拟 API 获取 AI 回复
      const response = await fetch('/api/dify/chat-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: state.currentConversation.dify_conversation_id,
          user_id: user.id,
        }),
      })

      if (!response.ok) throw new Error('发送消息失败')

      // 创建初始的 AI 消息占位符
      const aiMessage: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> = {
        content: '',
        role: 'assistant',
        dify_message_id: '',
        message_files: [],
        agent_thoughts: [],
        citation: [],
        feedback: null,
        more: {},
        annotation: null,
        is_opening_statement: false,
      }

      // 保存初始 AI 消息
      const savedAiMessage = await saveMessage(aiMessage)
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, savedAiMessage],
      }))

      let messageId = ''
      let conversationId = ''
      let accumulatedContent = ''

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  
                  // 提取消息ID和对话ID
                  if (parsed.message_id) messageId = parsed.message_id
                  if (parsed.conversation_id) conversationId = parsed.conversation_id
                  
                  // 累积内容
                  if (parsed.answer) {
                    accumulatedContent += parsed.answer
                    
                    // 实时更新消息内容
                    setState(prev => ({
                      ...prev,
                      messages: prev.messages.map(msg => 
                        msg.id === savedAiMessage.id 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    }))
                  }
                } catch (e) {
                  console.error('解析流式数据失败:', e)
                }
              }
            }
          }
        } catch (streamError) {
          console.error('流式响应错误:', streamError)
          throw streamError
        }
      }

      // 更新 AI 消息的最终内容
      await supabase
        .from('messages')
        .update({
          content: accumulatedContent,
          dify_message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedAiMessage.id)

      setState(prev => ({
        ...prev,
        isStreaming: false,
      }))

      // 更新对话的 Dify ID 和最后活动时间
      if (conversationId) {
        await supabase
          .from('conversations')
          .update({
            dify_conversation_id: conversationId,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.currentConversation.id)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : '发送消息失败',
      }))
    }
  }, [user, state.currentConversation, saveMessage])

  // 停止流式响应
  const stopStreaming = useCallback(() => {
    setState(prev => ({ ...prev, isStreaming: false }))
  }, [])

  // 重新生成回复
  const regenerateResponse = useCallback(async (messageId: string) => {
    // 实现重新生成逻辑
    console.log('Regenerate response for message:', messageId)
  }, [])

  // 评价消息
  const rateMessage = useCallback(async (messageId: string, rating: 'like' | 'dislike', reason?: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          feedback: { rating, reason },
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      if (error) throw error

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, feedback: { rating, reason } }
            : msg
        ),
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '评价消息失败',
      }))
    }
  }, [])

  // 更新对话
  const updateConversation = useCallback(async (conversationId: string, updates: Partial<Conversation>) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      if (error) throw error

      if (state.currentConversation?.id === conversationId) {
        setState(prev => ({
          ...prev,
          currentConversation: { ...prev.currentConversation!, ...updates },
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '更新对话失败',
      }))
    }
  }, [state.currentConversation])

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      if (error) throw error

      if (state.currentConversation?.id === conversationId) {
        setState(prev => ({
          ...prev,
          currentConversation: null,
          messages: [],
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除对话失败',
      }))
    }
  }, [state.currentConversation])

  // 初始化时加载对话
  useEffect(() => {
    if (user) {
      loadConversation()
    }
  }, [user, loadConversation])

  return {
    ...state,
    loadConversation,
    sendMessage,
    stopStreaming,
    regenerateResponse,
    rateMessage,
    createNewConversation,
    updateConversation,
    deleteConversation,
  }
}