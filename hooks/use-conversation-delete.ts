import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface DeleteState {
  isDeleting: boolean
  deleteError: string | null
  deleteSuccess: boolean
  deletedConversationId: string | null
}

interface DeleteResult {
  success: boolean
  message: string
  deleted_messages: number
  conversation?: any
}

export function useConversationDelete() {
  const { user } = useAuth()
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isDeleting: false,
    deleteError: null,
    deleteSuccess: false,
    deletedConversationId: null,
  })

  // 重置删除状态
  const resetDeleteState = useCallback(() => {
    setDeleteState({
      isDeleting: false,
      deleteError: null,
      deleteSuccess: false,
      deletedConversationId: null,
    })
  }, [])

  // 删除单个对话
  const deleteConversation = useCallback(async (conversationId: string): Promise<DeleteResult | null> => {
    if (!user) {
      setDeleteState(prev => ({
        ...prev,
        deleteError: '用户未登录',
      }))
      return null
    }

    // 防止重复删除
    if (deleteState.isDeleting) {
      return null
    }

    setDeleteState(prev => ({
      ...prev,
      isDeleting: true,
      deleteError: null,
      deleteSuccess: false,
      deletedConversationId: conversationId,
    }))

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      const result: DeleteResult = await response.json()

      if (result.success) {
        setDeleteState(prev => ({
          ...prev,
          isDeleting: false,
          deleteSuccess: true,
          deleteError: null,
        }))

        // 3秒后自动重置成功状态
        setTimeout(() => {
          setDeleteState(prev => ({
            ...prev,
            deleteSuccess: false,
            deletedConversationId: null,
          }))
        }, 3000)

        return result
      } else {
        throw new Error(result.message || '删除失败')
      }
    } catch (error: any) {
      setDeleteState(prev => ({
        ...prev,
        isDeleting: false,
        deleteError: error.message || '删除对话失败',
      }))

      return null
    }
  }, [user, deleteState.isDeleting])

  // 确认删除对话
  const confirmDeleteConversation = useCallback(async (
    conversationId: string,
    _conversationTitle: string = '此对话',
  ): Promise<boolean> => {
    // 返回 true 以允许删除操作，UI 组件应该处理确认对话框
    // 这样可以保持 hook 的纯净性，让 UI 组件决定如何显示确认对话框
    return Promise.resolve(true)
  }, [])

  // 删除对话（带确认）
  const deleteConversationWithConfirmation = useCallback(async (
    conversationId: string,
    conversationTitle: string = '此对话',
  ): Promise<DeleteResult | null> => {
    const confirmed = await confirmDeleteConversation(conversationId, conversationTitle)
    if (!confirmed) {
      return null
    }

    return deleteConversation(conversationId)
  }, [confirmDeleteConversation, deleteConversation])

  return {
    // 状态
    ...deleteState,

    // 方法
    deleteConversation,
    confirmDeleteConversation,
    deleteConversationWithConfirmation,
    resetDeleteState,

    // 计算属性
    canDelete: !deleteState.isDeleting && !!user,
    isProcessing: deleteState.isDeleting,
    hasError: !!deleteState.deleteError,
    hasSuccess: deleteState.deleteSuccess,
  }
}

// 获取认证令牌的辅助函数
async function getAuthToken(): Promise<string> {
  // 从 localStorage 或 sessionStorage 获取 token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('supabase.auth.token')
      || sessionStorage.getItem('supabase.auth.token')
    if (token) {
      const parsed = JSON.parse(token)
      return parsed.access_token || parsed.currentSession?.access_token || ''
    }
  }
  return ''
}

export default useConversationDelete
