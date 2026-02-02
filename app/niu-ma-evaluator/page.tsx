'use client'

import React from 'react'
import IntegratedNiuMaChat from '@/app/components/tools/niuma-evaluator/IntegratedNiuMaChat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const NiuMaEvaluatorPage: React.FC = () => {
  try {
    return (
      <ErrorBoundary>
        <PageAuthGuard requireAuth={true}>
          <IntegratedNiuMaChat />
        </PageAuthGuard>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('NiuMaEvaluatorPage error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">页面加载错误</h1>
          <p className="text-gray-600 mb-4">牛马测评仪页面暂时无法访问，请稍后重试。</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}

export default NiuMaEvaluatorPage
