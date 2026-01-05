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
        <div className="min-h-screen bg-gray-50">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="牛马测评仪" />

          <div className="bg-gradient-to-br from-pink-50 via-white to-rose-50 pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4">
              {/* 页面标题 */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  🐂🐴 牛马测评仪
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  AI 驱动的职场处境智能评估系统
                </p>
              </div>

              {/* 对话界面 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">职场处境测评</h2>
                  <p className="text-gray-500 text-sm">
                    描述您的职场处境,AI 将为您进行全方位的测评分析
                  </p>
                </div>
                <NiMaEvaluatorChat />
              </div>

              {/* 温馨提示 */}
              <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">💝</span>
                  <h3 className="text-lg font-semibold text-gray-900">温馨提示</h3>
                </div>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>• 诚实描述您的处境，才能获得更准确的评估</li>
                  <li>• 测评结果仅供参考，请结合实际情况做决定</li>
                  <li>• 职场困境是暂时的，保持积极心态</li>
                  <li>• 必要时寻求专业的职业咨询或心理支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default NiMaEvaluatorPage
