'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DisputeQuestionnaire from '@/app/components/tools/dispute-questionnaire'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const DisputeCenterPage: React.FC = () => {
  const { checkAndRequireAuth: _checkAndRequireAuth } = useAuth()

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="争议解决中心" />

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 pt-24 pb-8">
            <div className="max-w-4xl mx-auto px-4">
              {/* 页面标题 */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  📋 争议问题问卷调查
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  请根据您的实际情况填写问卷，AI 将为您生成专业的法律分析报告
                </p>
              </div>

              {/* 问卷界面 */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <DisputeQuestionnaire />
              </div>

              {/* 功能说明 */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">✓</div>
                  <h3 className="font-semibold text-gray-800 mb-2">简单快捷</h3>
                  <p className="text-sm text-gray-600">只需填写几项关键信息，即可获得专业分析</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-800 mb-2">精准分析</h3>
                  <p className="text-sm text-gray-600">基于法律知识库，提供针对性的建议</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-3">📄</div>
                  <h3 className="font-semibold text-gray-800 mb-2">完整报告</h3>
                  <p className="text-sm text-gray-600">生成详细的法律分析和解决方案</p>
                </div>
              </div>

              {/* 使用提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">💡</span>
                  <h3 className="text-lg font-semibold text-blue-800">问卷使用提示</h3>
                </div>
                <ul className="text-blue-700 space-y-2">
                  <li>• 请如实填写问卷信息，确保分析准确性</li>
                  <li>• 标注 * 的项目为必填项</li>
                  <li>• 描述越详细，分析越精准</li>
                  <li>• 完成问卷后点击"提交分析"获取报告</li>
                  <li>• 如需咨询其他问题，可点击"重新问卷"</li>
                </ul>
              </div>

              {/* 法律提示 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">⚠️</span>
                  <h3 className="text-lg font-semibold text-yellow-800">重要法律提示</h3>
                </div>
                <ul className="text-yellow-700 space-y-2">
                  <li>• 劳动争议处理时效为1年，请及时行动</li>
                  <li>• 保留所有相关证据是维权成功的关键</li>
                  <li>• 建议优先选择协商调解等温和方式解决争议</li>
                  <li>• 复杂案件建议咨询专业律师</li>
                  <li>• AI 分析报告仅供参考，不构成法律意见</li>
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
