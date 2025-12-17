'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Conversation } from '@/app/components/chat/types'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface WelcomeScreenProps {
  user?: any
  conversations?: Conversation[]
  onStartNewChat: (presetQuestion?: string) => void
  onDeleteConversation?: (conversationId: string) => Promise<boolean>
  onLoadConversations?: () => Promise<void>
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  user,
  onStartNewChat,
  onDeleteConversation,
  onLoadConversations,
}) => {
  const router = useRouter()

  const quickActions = [
    {
      title: '劳动合同问题',
      question: '我的劳动合同有哪些需要注意的地方？',
      icon: '📄',
    },
    {
      title: '工资纠纷',
      question: '公司拖欠工资，我应该怎么维权？',
      icon: '💰',
    },
    {
      title: '加班费计算',
      question: '如何正确计算加班费？',
      icon: '⏰',
    },
    {
      title: '工伤赔偿',
      question: '工伤认定标准和赔偿流程是什么？',
      icon: '🏥',
    },
    {
      title: '解除合同',
      question: '什么情况下可以合法解除劳动合同？',
      icon: '🚪',
    },
    {
      title: '社保问题',
      question: '公司不交社保，我该怎么办？',
      icon: '🛡️',
    },
  ]

  const [_showCopyToast, _setShowCopyToast] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    conversationId: string | null
  }>({
    isOpen: false,
    title: '',
    message: '',
    conversationId: null,
  })
  const [toast, setToast] = React.useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({
    show: false,
    message: '',
    type: 'success',
  })

  // 显示 Toast 通知
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // 删除对话函数
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !conversationId) {
      showToast('删除失败：用户未认证或对话ID无效', 'error')
      return false
    }

    setIsLoading(true)
    try {
      // 如果有自定义的删除函数，使用它
      if (onDeleteConversation) {
        const result = await onDeleteConversation(conversationId)
        if (result) {
          showToast('对话删除成功', 'success')
          // 重新加载对话列表
          if (onLoadConversations) {
            await onLoadConversations()
          }
          return true
        } else {
          showToast('删除失败', 'error')
          return false
        }
      }

      // 否则使用默认的删除逻辑
      console.log('开始删除对话，用户:', user.email, '对话ID:', conversationId)

      let response: Response

      // 尝试获取session
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session && session.access_token) {
          response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
        } else {
          // 使用用户信息认证
          response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-User-ID': user.id,
              'X-User-Email': user.email || '',
            },
          })
        }
      } catch {
        // 直接使用用户信息认证
        response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id,
            'X-User-Email': user.email || '',
          },
        })
      }

      if (!response.ok) {
        let errorMessage = `删除失败: ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText) {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorMessage
          }
        } catch {
          // 忽略解析错误
        }
        throw new Error(errorMessage)
      }

      showToast('对话删除成功', 'success')

      // 重新加载对话列表
      if (onLoadConversations) {
        await onLoadConversations()
      }

      return true
    } catch (error) {
      console.error('删除对话失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除对话失败'
      showToast(`删除失败: ${errorMessage}`, 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // 显示删除确认对话框
  const _showDeleteConfirm = (conversation: Conversation) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除对话',
      message: `确定要删除对话"${conversation.title}"吗？此操作不可撤销！`,
      conversationId: conversation.id,
    })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (confirmDialog.conversationId) {
      await handleDeleteConversation(confirmDialog.conversationId)
    }
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      conversationId: null,
    })
  }

  // 取消删除
  const cancelDelete = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      conversationId: null,
    })
  }

  // 渲染对话列表 - 不再在主页面显示
  const _renderConversationList = () => {
    // 对话历史现在只在侧边栏显示，这里返回空
    return null
  }

  const handleQuickAction = async (question: string) => {
    // 直接开始对话而不是复制到剪贴板
    onStartNewChat(question)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl w-full px-6 py-8">
        {/* 主要欢迎区域 */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-40 h-40 mb-3">
              <img
                src="/logo.jpeg"
                alt="劳动法助手"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              欢迎使用劳动法智能助手
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {user ? `你好，${user.name || user.email}！` : '你好！'}
              我是您的专业劳动法咨询助手，随时为您提供专业的法律建议和解决方案。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => onStartNewChat()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              💬 开始对话
            </button>
            <button
              onClick={() => router.push('/tools')}
              className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              🛠️ 使用工具
            </button>
          </div>
        </div>

        {/* 对话历史现在只在侧边栏显示，不在此处显示 */}

        {/* 快速开始 */}
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            快速开始
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.question)}
                className="bg-white rounded-xl p-4 text-left shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">{action.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {action.question}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
            <span className="text-blue-600 text-sm">
              💡 点击"开始对话"立即咨询，或选择上方的问题开始对话
            </span>
          </div>
        </div>

        {/* 删除确认对话框 */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {confirmDialog.message}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast 通知 */}
        {toast.show && (
          <div className="fixed top-8 right-8 z-50">
            <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {toast.type === 'success'
                  ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  )
                  : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  )}
              </svg>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* 复制成功提示 */}
        {_showCopyToast && (
          <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="font-medium">问题已复制到剪贴板</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WelcomeScreen
