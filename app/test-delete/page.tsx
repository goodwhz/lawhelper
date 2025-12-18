'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useConversationDelete } from '@/hooks/use-conversation-delete'
import useConversation from '@/hooks/use-conversation'
import DeleteConfirmationDialog from '@/app/components/delete-confirmation-dialog'
import type { ConversationItem } from '@/types/app'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'

export default function TestDeletePage() {
  const { removeConversationFromList: _removeConversationFromList, clearDeletedConversationCache: _clearDeletedConversationCache } = useConversation()
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
        name: '劳动争议咨询',
        created_at: new Date('2024-01-16').toISOString(),
        updated_at: new Date('2024-01-16').toISOString(),
        user_id: 'test_user_001',
        message_count: 8,
        last_message: '关于加班费的法律问题',
      },
      {
        id: 'conv_003',
        name: '房产纠纷对话',
        created_at: new Date('2024-01-17').toISOString(),
        updated_at: new Date('2024-01-17').toISOString(),
        user_id: 'test_user_001',
        message_count: 3,
        last_message: '关于房屋买卖合同的咨询',
      }
    ]
    setMockConversations(testConversations)
  }, [])

  if (!selectedConversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 移动端页面头部 */}
        <MobilePageHeader title="删除功能测试" />
        
        <div className="p-8">
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

            {/* 测试对话列表 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  测试对话列表
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  点击任意对话测试删除功能
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {mockConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {conversation.name}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>消息: {conversation.message_count}</span>
                          <span>更新: {new Date(conversation.updated_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-2 text-gray-600">
                          {conversation.last_message}
                        </p>
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => setSelectedConversation(conversation)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          删除测试
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 功能测试说明 */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  功能测试说明
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">权限验证</h3>
                    <p className="text-gray-600">验证只有对话所有者才能删除自己的对话</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">确认对话框</h3>
                    <p className="text-gray-600">删除前显示确认对话框，防止误操作</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">数据一致性</h3>
                    <p className="text-gray-600">删除后更新对话列表，清除相关缓存</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">错误处理</h3>
                    <p className="text-gray-600">优雅处理删除失败的情况，显示错误信息</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 删除状态显示 */}
            {(deleteError || deleteSuccess || deletedConversationId) && (
              <div className="mt-6 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    删除操作状态
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800">删除失败</h3>
                      <p className="text-red-700 text-sm mt-1">{deleteError}</p>
                    </div>
                  )}
                  
                  {deleteSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800">删除成功</h3>
                      <p className="text-green-700 text-sm mt-1">
                        对话 {deletedConversationId} 已成功删除
                      </p>
                    </div>
                  )}
                  
                  {isDeleting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800">正在删除...</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        请稍候，正在处理删除请求
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast 通知 */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`max-w-sm rounded-lg shadow-lg p-4 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            } text-white`}>
              <div className="flex items-center">
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedConversation(null)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← 返回测试列表
          </button>
        </div>

        {/* 对话详情 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedConversation.name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedConversation.message_count} 条消息
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {new Date(selectedConversation.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">对话信息</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">对话ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedConversation.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">用户ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedConversation.user_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(selectedConversation.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">最后更新</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(selectedConversation.updated_at).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">最后消息</h3>
                <p className="text-gray-600">{selectedConversation.last_message}</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">删除操作</h3>
                <p className="text-gray-600 mb-4">
                  点击下方按钮将删除此对话。此操作不可撤销，请谨慎操作。
                </p>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => deleteConversationWithConfirmation(selectedConversation.id, () => {
                      showToast('删除成功', 'success')
                      setSelectedConversation(null)
                      // 从模拟数据中移除
                      setMockConversations(prev => 
                        prev.filter(conv => conv.id !== selectedConversation.id)
                      )
                    })}
                    disabled={isDeleting || !canDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isDeleting ? '正在删除...' : '删除此对话'}
                  </button>
                  
                  {!canDelete && (
                    <span className="text-sm text-gray-500">
                      您没有权限删除此对话
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showConfirmDialog && selectedConversation && (
        <DeleteConfirmationDialog
          conversationName={selectedConversation.name}
          onConfirm={() => {
            // 这里会触发实际的删除操作
            setShowConfirmDialog(false)
            showToast('删除操作已确认', 'info')
          }}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  )
}