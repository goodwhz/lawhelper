'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LaborDisputeProcess from '@/app/components/tools/labor-dispute-process'
import PersonnelDisputeProcess from '@/app/components/tools/personnel-dispute-process'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const DisputeCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'labor' | 'personnel'>('labor')
  const { checkAndRequireAuth } = useAuth()

  const tabs = [
    {
      id: 'labor',
      title: '劳动争议解决',
      icon: '⚖️',
      description: '处理工资、解除合同、歧视等劳动争议',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'personnel',
      title: '人事争议解决', 
      icon: '👥',
      description: '处理晋升、薪酬、调岗等人事争议',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          <Navigation />
          
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            🏛️ 争议解决中心
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            专业的劳动争议和人事争议解决平台，为您提供个性化、专业化的法律解决方案
          </p>
        </div>



        {/* 标签页导航 */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (checkAndRequireAuth()) {
                    setActiveTab(tab.id as 'labor' | 'personnel')
                  }
                }}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 标签内容 */}
          <div className="p-6">
            {activeTab === 'labor' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">劳动争议解决流程</h2>
                  <p className="text-gray-600">
                    针对工资、解除合同、歧视、社保等劳动争议，提供专业的流程指导和风险评估
                  </p>
                </div>
                <LaborDisputeProcess />
              </div>
            )}

            {activeTab === 'personnel' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">人事争议解决路径</h2>
                  <p className="text-gray-600">
                    处理晋升、薪酬、调岗、考核等人事争议，提供多路径分析和专业建议
                  </p>
                </div>
                <PersonnelDisputeProcess />
              </div>
            )}
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