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
        <div className="min-h-screen bg-white">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="牛马测评仪" />

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4">
              {/* 页面标题 */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  🐂🐴 牛马测评仪
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  使用AI技术,为您评估职场处境,提供专业建议
                </p>
              </div>

              {/* 对话界面 */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">职场处境测评</h2>
                  <p className="text-gray-600">
                    描述您的职场处境,AI 将为您进行全方位的测评分析
                  </p>
                </div>
                <NiMaEvaluatorChat />
              </div>

              {/* 功能说明 */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-800 mb-2">精准评估</h3>
                  <p className="text-sm text-gray-600">AI 深度分析职场处境,多维度评估您的现状</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">💡</div>
                  <h3 className="font-semibold text-gray-800 mb-2">专业建议</h3>
                  <p className="text-sm text-gray-600">基于分析结果,提供个性化的职场改善建议</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-800 mb-2">客观分析</h3>
                  <p className="text-sm text-gray-600"> unbiased 的第三方视角,帮助您理性看待问题</p>
                </div>
              </div>

              {/* 温馨提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">💝</span>
                  <h3 className="text-lg font-semibold text-blue-800">温馨提示</h3>
                </div>
                <ul className="text-blue-700 space-y-2">
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
