'use client'

import React from 'react'
import IntegratedChat from '@/app/components/chat/IntegratedChat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatPage: React.FC = () => {
  try {
    return (
      <ErrorBoundary>
        <PageAuthGuard requireAuth={true}>
          <IntegratedChat />
        </PageAuthGuard>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('AiChatPage error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">页面加载错误</h1>
          <p className="text-gray-600 mb-4">聊天页面暂时无法访问，请稍后重试。</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}

export default AiChatPage
