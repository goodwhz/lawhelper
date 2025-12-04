'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useConversationDelete } from '@/hooks/use-conversation-delete'
import useConversation from '@/hooks/use-conversation'
import DeleteConfirmationDialog from '@/app/components/delete-confirmation-dialog'
import type { ConversationItem } from '@/types/app'

export default function TestDeletePage() {
  const { removeConversationFromList, clearDeletedConversationCache } = useConversation()
  const {
    deleteConversationWithConfirmation,
    isDeleting,
    deleteError,
    deleteSuccess,
    deletedConversationId,
    canDelete,
  } = useConversationDelete()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null)

  // 模拟一些测试数据
  const [mockConversations, setMockConversations] = useState<ConversationItem[]>([])
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({ show: false, message: '', type: 'info' })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  useEffect(() => {
    // 创建一些测试对话数据
    const testConversations: ConversationItem[] = [
      {
        id: 'conv_001',
        name: '法律咨询对话 1',
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date('2024-01-15').toISOString(),
        user_id: 'test_user_001',
        message_count: 5,
        last_message: '关于合同纠纷的法律建议',
      },
      {
        id: 'conv_002',
        name: '劳动法相关问题',
        created_at: new Date('2024-01-16').toISOString(),
        updated_at: new Date('2024-01-16').toISOString(),
        user_id: 'test_user_001',
        message_count: 12,
        last_message: '工资拖欠的解决方案',
      },
      {
        id: 'conv_003',
        name: '房产交易咨询',
        created_at: new Date('2024-01-17').toISOString(),
        updated_at: new Date('2024-01-17').toISOString(),
        user_id: 'test_user_001',
        message_count: 8,
        last_message: '购房合同注意事项',
      },
    ]
    setMockConversations(testConversations)
  }, [])

  const handleDeleteClick = (conversation: ConversationItem) => {
    setSelectedConversation(conversation)
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedConversation) { return }

    const result = await deleteConversationWithConfirmation(
      selectedConversation.id,
      selectedConversation.name,
    )

    if (result?.success) {
      // 从列表中移除删除的对话
      removeConversationFromList(selectedConversation.id)

      // 清除相关缓存
      clearDeletedConversationCache(selectedConversation.id)

      console.log('对话删除成功:', {
        conversationId: selectedConversation.id,
        deletedMessages: result.deleted_messages,
      })

      // 显示成功消息
      const successMessage = result.deleted_messages > 0
        ? `成功删除对话"${selectedConversation.name}"和${result.deleted_messages}条消息`
        : `成功删除对话"${selectedConversation.name}"`

      showToast(successMessage, 'success')
    }

    // 关闭对话框
    setShowConfirmDialog(false)
    setSelectedConversation(null)
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setSelectedConversation(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗑️ 对话删除功能测试
          </h1>
          <p className="text-gray-600">
            测试单个对话删除功能，验证权限验证、数据一致性和用户体验
          </p>
        </div>

        {/* 状态显示 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">删除状态监控</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isDeleting ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-sm font-medium text-gray-600 mb-1">删除状态</div>
              <div className={`text-lg font-semibold ${
                isDeleting ? 'text-yellow-700' : 'text-gray-900'
              }`}>
                {isDeleting ? '正在删除...' : '空闲'}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              deleteSuccess ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-sm font-medium text-gray-600 mb-1">上次操作</div>
              <div className={`text-lg font-semibold ${
                deleteSuccess ? 'text-green-700' : 'text-gray-900'
              }`}>
                {deleteSuccess ? '删除成功' : '等待操作'}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              deleteError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-sm font-medium text-gray-600 mb-1">错误状态</div>
              <div className={`text-lg font-semibold ${
                deleteError ? 'text-red-700' : 'text-gray-900'
              }`}>
                {deleteError || '无错误'}
              </div>
            </div>
          </div>
        </div>

        {/* 对话列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">测试对话列表</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {mockConversations.map(conversation => (
              <div
                key={conversation.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {conversation.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>对话ID: {conversation.id}</p>
                      <p>消息数量: {conversation.message_count}</p>
                      <p>最后消息: {conversation.last_message}</p>
                      <p>创建时间: {new Date(conversation.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteClick(conversation)}
                      disabled={!canDelete || (deletedConversationId === conversation.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        deletedConversationId === conversation.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                      }`}
                    >
                      {deletedConversationId === conversation.id
                        ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            删除中...
                          </span>
                        )
                        : (
                          '删除对话'
                        )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 测试说明</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>点击"删除对话"按钮会弹出确认对话框</li>
              <li>确认后系统会删除对话及其所有消息</li>
              <li>删除成功后会自动从列表中移除</li>
              <li>状态监控面板会显示实时删除状态</li>
              <li>支持错误处理和重试机制</li>
            </ol>

            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">🔍 验证要点：</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>权限验证：只能删除自己的对话</li>
                <li>数据一致性：消息和对话同步删除</li>
                <li>用户体验：友好的确认和反馈</li>
                <li>错误处理：清晰的错误提示和状态</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 删除确认对话框 */}
        <DeleteConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          conversationTitle={selectedConversation?.name}
          messageCount={selectedConversation?.message_count}
          isDeleting={deletedConversationId === selectedConversation?.id}
        />

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
      </div>
    </div>
  )
}
