'use client'

import React from 'react'
import NiMaEvaluatorChat from '@/app/components/tools/niu-ma-evaluator-chat'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const NiMaEvaluatorPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="h-screen bg-gray-50 flex flex-col">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="牛马测评仪" />

          {/* 主要内容区域，占据剩余空间 */}
          <div className="flex-1 bg-gradient-to-br from-pink-50 via-white to-rose-50 pt-20 lg:pt-24 overflow-hidden">
            <div className="h-full max-w-7xl mx-auto px-4 flex flex-col">
              {/* 对话界面 */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">职场处境测评</h2>
                  <p className="text-gray-500 text-sm">
                    描述您的职场处境,AI 将为您进行全方位的测评分析
                  </p>
                </div>
                <div className="flex-1 min-h-0">
                  <NiMaEvaluatorChat />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default NiMaEvaluatorPage
