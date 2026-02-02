/**
 * 牛马测评仪 - Supabase 数据交互 Hook
 * 参考智能核心的 useSupabaseChat Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type {
  Evaluation,
  EvaluationMessage,
  EvaluationResult,
  CreateEvaluationInput,
  CreateMessageInput,
  UpdateEvaluationInput,
  CreateEvaluationResultInput,
  UseNiuMaSupabaseChatReturn,
  MessageCacheItem,
  EvaluationCacheItem,
} from '../types'

// 缓存配置
const CACHE_CONFIG = {
  MESSAGE_TTL: 5 * 60 * 1000, // 5分钟
  EVALUATION_TTL: 10 * 60 * 1000, // 10分钟
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 60 * 1000, // 1分钟
}

/**
 * 牛马测评仪 Supabase Hook
 */
export const useNiuMaSupabaseChat = (userId: string | null): UseNiuMaSupabaseChatReturn => {
  // 状态管理
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [messages, setMessages] = useState<EvaluationMessage[]>([])
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null)

  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingResult, setIsLoadingResult] = useState(false)

  // 错误状态
  const [error, setError] = useState<string | null>(null)

  // 缓存
  const messageCache = useRef<Map<string, MessageCacheItem>>(new Map())
  const evaluationCache = useRef<Map<string, EvaluationCacheItem>>(new Map())

  // 清理过期缓存
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now()

      // 清理消息缓存
      messageCache.current.forEach((item, key) => {
        if (now - item.timestamp > item.ttl) {
          messageCache.current.delete(key)
        }
      })

      // 清理测评缓存
      evaluationCache.current.forEach((item, key) => {
        if (now - item.timestamp > item.ttl) {
          evaluationCache.current.delete(key)
        }
      })
    }

    const interval = setInterval(cleanupCache, CACHE_CONFIG.CLEANUP_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // 加载测评列表
  const loadEvaluations = useCallback(async () => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查缓存
      const cacheKey = `evaluations_${userId}`
      const cached = evaluationCache.current.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setEvaluations(cached.evaluations)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('niuma_evaluations')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false })

      if (fetchError) { throw fetchError }

      setEvaluations(data || [])

      // 缓存结果
      evaluationCache.current.set(cacheKey, {
        evaluations: data || [],
        timestamp: Date.now(),
        ttl: CACHE_CONFIG.EVALUATION_TTL,
      })
    } catch (err: any) {
      console.error('加载测评列表失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 加载单个测评
  const loadEvaluation = useCallback(async (evaluationId: string) => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setIsLoadingMessages(true)
    setError(null)

    try {
      // 检查缓存
      const cacheKey = `messages_${evaluationId}`
      const cached = messageCache.current.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setMessages(cached.messages)
        return
      }

      // 并行加载测评和消息
      const [evaluationResult, messagesResult] = await Promise.all([
        supabase
          .from('niuma_evaluations')
          .select('*')
          .eq('id', evaluationId)
          .single(),
        supabase
          .from('niuma_evaluation_messages')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('created_at', { ascending: true }),
      ])

      if (evaluationResult.error) { throw evaluationResult.error }
      if (messagesResult.error) { throw messagesResult.error }

      setCurrentEvaluation(evaluationResult.data)
      setMessages(messagesResult.data || [])

      // 缓存消息
      messageCache.current.set(cacheKey, {
        messages: messagesResult.data || [],
        timestamp: Date.now(),
        ttl: CACHE_CONFIG.MESSAGE_TTL,
      })
    } catch (err: any) {
      console.error('加载测评失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [userId])

  // 创建新测评
  const createEvaluation = useCallback(async (input: CreateEvaluationInput): Promise<Evaluation | null> => {
    if (!userId) {
      setError('用户未登录')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('创建测评，输入:', input)

      const { data, error: insertError, status, statusText } = await supabase
        .from('niuma_evaluations')
        .insert({
          user_id: userId,
          title: input.title || '新测评',
          version: input.version,
          metadata: input.metadata || {},
          settings: input.settings || {},
        })
        .select()
        .single()

      console.log('Supabase 插入响应:', { data, error: insertError, status, statusText })

      if (insertError) {
        console.error('Supabase 插入错误:', insertError)
        throw insertError
      }

      if (!data) {
        console.error('插入成功但未返回数据')
        throw new Error('插入成功但未返回数据')
      }

      console.log('测评创建成功:', data)

      // 清除缓存
      evaluationCache.current.delete(`evaluations_${userId}`)

      // 更新列表
      setEvaluations(prev => [data, ...prev])
      setCurrentEvaluation(data)

      return data
    } catch (err: any) {
      console.error('创建测评失败:', err)
      console.error('错误详情:', JSON.stringify(err, null, 2))

      // 检查是否是表不存在的错误
      if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
        setError('数据库表尚未创建，请先应用数据库迁移。查看 docs/NIUMA_MIGRATION_GUIDE.md 了解详情。')
        return null
      }

      // 检查是否是 RLS 策略错误
      if (err?.code === '42501') {
        setError('权限不足，请检查登录状态。')
        return null
      }

      const errorMessage = err?.message || err?.error_description || JSON.stringify(err)
      // 如果错误消息是空对象或"{}"，使用默认消息
      const displayError = (errorMessage === '{}' || !errorMessage) ? '未知错误，请重试' : errorMessage
      setError(displayError)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 更新测评
  const updateEvaluation = useCallback(async (evaluationId: string, input: UpdateEvaluationInput): Promise<void> => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setError(null)

    try {
      const updates: any = {}
      if (input.title !== undefined) { updates.title = input.title }
      if (input.status !== undefined) { updates.status = input.status }
      if (input.metadata !== undefined) { updates.metadata = input.metadata }
      if (input.settings !== undefined) { updates.settings = input.settings }

      const { error: updateError } = await supabase
        .from('niuma_evaluations')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', evaluationId)
        .eq('user_id', userId)

      if (updateError) { throw updateError }

      // 清除缓存
      evaluationCache.current.delete(`evaluations_${userId}`)

      // 更新列表
      setEvaluations(prev =>
        prev.map(ev => ev.id === evaluationId ? { ...ev, ...updates } : ev),
      )

      // 更新当前测评
      if (currentEvaluation?.id === evaluationId) {
        setCurrentEvaluation(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (err: any) {
      console.error('更新测评失败:', err)
      setError(err.message || '更新失败')
    }
  }, [userId, currentEvaluation])

  // 删除测评
  const deleteEvaluation = useCallback(async (evaluationId: string): Promise<void> => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('niuma_evaluations')
        .update({ status: 'deleted' })
        .eq('id', evaluationId)
        .eq('user_id', userId)

      if (deleteError) { throw deleteError }

      // 清除缓存
      evaluationCache.current.delete(`evaluations_${userId}`)
      messageCache.current.delete(`messages_${evaluationId}`)

      // 从列表中移除
      setEvaluations(prev => prev.filter(ev => ev.id !== evaluationId))

      // 如果删除的是当前测评，清空当前状态
      if (currentEvaluation?.id === evaluationId) {
        setCurrentEvaluation(null)
        setMessages([])
        setCurrentResult(null)
      }
    } catch (err: any) {
      console.error('删除测评失败:', err)
      setError(err.message || '删除失败')
    }
  }, [userId, currentEvaluation])

  // 批量删除测评
  const deleteMultipleEvaluations = useCallback(async (evaluationIds: string[]): Promise<void> => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('niuma_evaluations')
        .update({ status: 'deleted' })
        .in('id', evaluationIds)
        .eq('user_id', userId)

      if (deleteError) { throw deleteError }

      // 清除缓存
      evaluationCache.current.delete(`evaluations_${userId}`)
      evaluationIds.forEach(id => messageCache.current.delete(`messages_${id}`))

      // 从列表中移除
      setEvaluations(prev => prev.filter(ev => !evaluationIds.includes(ev.id)))

      // 如果删除的包含当前测评
      if (currentEvaluation && evaluationIds.includes(currentEvaluation.id)) {
        setCurrentEvaluation(null)
        setMessages([])
        setCurrentResult(null)
      }
    } catch (err: any) {
      console.error('批量删除失败:', err)
      setError(err.message || '删除失败')
    }
  }, [userId, currentEvaluation])

  // 保存消息
  const saveMessage = useCallback(async (input: CreateMessageInput): Promise<EvaluationMessage | null> => {
    if (!userId) {
      setError('用户未登录')
      return null
    }

    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('niuma_evaluation_messages')
        .insert({
          evaluation_id: input.evaluation_id,
          user_id: userId,
          content: input.content,
          role: input.role,
          coze_message_id: input.coze_message_id,
          message_data: input.message_data || {},
        })
        .select()
        .single()

      if (insertError) { throw insertError }

      // 清除缓存
      messageCache.current.delete(`messages_${input.evaluation_id}`)

      // 添加到消息列表
      setMessages(prev => [...prev, data!])

      return data
    } catch (err: any) {
      console.error('保存消息失败:', err)
      setError(err.message || '保存失败')
      return null
    }
  }, [userId])

  // 发送消息（保存到数据库）
  const sendMessage = useCallback(async (content: string, role: MessageRole = 'user'): Promise<EvaluationMessage | null> => {
    if (!currentEvaluation) {
      setError('请先选择一个测评')
      return null
    }

    return saveMessage({
      evaluation_id: currentEvaluation.id,
      content,
      role,
    })
  }, [currentEvaluation, saveMessage])

  // 更新消息（反馈）
  const updateMessage = useCallback(async (messageId: string, feedback?: any): Promise<void> => {
    if (!userId) {
      setError('用户未登录')
      return
    }

    setError(null)

    try {
      const updates: any = {}
      if (feedback !== undefined) { updates.feedback = feedback }

      const { error: updateError } = await supabase
        .from('niuma_evaluation_messages')
        .update(updates)
        .eq('id', messageId)
        .eq('user_id', userId)

      if (updateError) { throw updateError }

      // 更新本地消息列表
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg),
      )
    } catch (err: any) {
      console.error('更新消息失败:', err)
      setError(err.message || '更新失败')
    }
  }, [userId])

  // 保存测评结果
  const saveResult = useCallback(async (input: CreateEvaluationResultInput): Promise<EvaluationResult | null> => {
    if (!userId) {
      setError('用户未登录')
      return null
    }

    setIsLoadingResult(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('niuma_evaluation_results')
        .insert({
          evaluation_id: input.evaluation_id,
          user_id: userId,
          total_score: input.total_score,
          salary_score: input.salary_score,
          workload_score: input.workload_score,
          growth_score: input.growth_score,
          environment_score: input.environment_score,
          atmosphere_score: input.atmosphere_score,
          mental_health_score: input.mental_health_score,
          evaluation_summary: input.evaluation_summary,
          suggestions: input.suggestions,
          dimensions: input.dimensions || {},
        })
        .select()
        .single()

      if (insertError) { throw insertError }

      setCurrentResult(data)
      return data
    } catch (err: any) {
      console.error('保存测评结果失败:', err)
      setError(err.message || '保存失败')
      return null
    } finally {
      setIsLoadingResult(false)
    }
  }, [userId])

  // 加载测评结果
  const loadResult = useCallback(async (evaluationId: string): Promise<EvaluationResult | null> => {
    if (!userId) {
      setError('用户未登录')
      return null
    }

    setIsLoadingResult(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('niuma_evaluation_results')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // 没有结果，返回null
          setCurrentResult(null)
          return null
        }
        throw fetchError
      }

      setCurrentResult(data)
      return data
    } catch (err: any) {
      console.error('加载测评结果失败:', err)
      setError(err.message || '加载失败')
      return null
    } finally {
      setIsLoadingResult(false)
    }
  }, [userId])

  // 刷新当前测评
  const refreshCurrentEvaluation = useCallback(async () => {
    if (currentEvaluation) {
      await loadEvaluation(currentEvaluation.id)
      await loadResult(currentEvaluation.id)
    }
  }, [currentEvaluation, loadEvaluation, loadResult])

  return {
    evaluations,
    currentEvaluation,
    messages,
    currentResult,
    isLoading,
    isLoadingMessages,
    isLoadingResult,
    error,
    loadEvaluations,
    loadEvaluation,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    deleteMultipleEvaluations,
    sendMessage,
    saveMessage,
    updateMessage,
    saveResult,
    loadResult,
    setCurrentEvaluation,
    refreshCurrentEvaluation,
  }
}
