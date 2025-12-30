'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CozeDisputeChat from '@/app/components/tools/coze-dispute-chat'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const DisputeCenterPage: React.FC = () => {
  const { checkAndRequireAuth } = useAuth()

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="争议解决中心" />

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4">
              {/* 页面标题 */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  🤖 智能争议解决助手
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  使用先进的 AI 技术为您提供专业的劳动和人事争议咨询服务
                </p>
              </div>

              {/* Coze 对话界面 */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">智能法律咨询</h2>
                  <p className="text-gray-600">
                    请输入您遇到的争议类型和具体情况,AI 助手将为您提供专业的分析和建议
                  </p>
                </div>
                <CozeDisputeChat />
              </div>

              {/* 功能说明 */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">💬</div>
                  <h3 className="font-semibold text-gray-800 mb-2">实时对话</h3>
                  <p className="text-sm text-gray-600">通过自然语言描述您的问题,AI 助手会理解并提供建议</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold text-gray-800 mb-2">快速响应</h3>
                  <p className="text-sm text-gray-600">即时获取分析结果,无需等待,提高问题解决效率</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="font-semibold text-gray-800 mb-2">专业知识</h3>
                  <p className="text-sm text-gray-600">基于丰富的法律知识库,提供准确的建议和分析</p>
                </div>
              </div>

              {/* 法律提示 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">💡</span>
                  <h3 className="text-lg font-semibold text-yellow-800">重要法律提示</h3>
                </div>
                <ul className="text-yellow-700 space-y-2">
                  <li>• 劳动争议处理时效为1年，请及时行动</li>
                  <li>• 保留所有相关证据是维权成功的关键</li>
                  <li>• 建议优先选择协商调解等温和方式解决争议</li>
                  <li>• 复杂案件建议咨询专业律师</li>
                  <li>• AI 助手的建议仅供参考，不构成法律意见</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default DisputeCenterPage
