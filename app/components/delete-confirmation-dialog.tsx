'use client'

import React from 'react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  conversationTitle?: string
  messageCount?: number
  isDeleting?: boolean
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  conversationTitle = '此对话',
  messageCount = 0,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) { return null }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 警告图标 */}
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3.054L12.252 4.486A2.25 2.25 0 0011.544 3H4.456a2.25 2.25 0 00-2.062 1.456L4.026 15.946A2.25 2.25 0 006 18h12c1.544 0 2.506-1.667 1.932-3.054z" />
          </svg>
        </div>

        {/* 标题 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          删除对话
        </h2>

        {/* 内容 */}
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            确定要删除对话 <span className="font-medium text-gray-900">"{conversationTitle}"</span> 吗？
          </p>

          {messageCount > 0 && (
            <p className="text-sm text-gray-500 text-center">
              此对话包含 {messageCount} 条消息
            </p>
          )}

          {/* 警告信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3.054L12.252 4.486A2.25 2.25 0 0011.544 3H4.456a2.25 2.25 0 00-2.062 1.456L4.026 15.946A2.25 2.25 0 006 18h12C1.544 0 2.506-1.667 1.932-3.054z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ 此操作不可逆转</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>将永久删除对话及其所有消息</li>
                  <li>删除后无法恢复任何内容</li>
                  <li>操作立即生效</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex space-x-3 pt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {isDeleting
              ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  删除中...
                </>
              )
              : (
                '确认删除'
              )}
          </button>
        </div>
      </div>
    </div>
  )
}
