'use client'

import React from 'react'
import type { WelcomeCard } from '../types'

interface NiuMaWelcomeScreenProps {
  onQuickStart: (version: 'simple' | 'normal', title: string) => void
  onNewEvaluation: (version: 'simple' | 'normal') => void
  onDeleteAll: () => void
  evaluationCount: number
}

const NiuMaWelcomeScreen: React.FC<NiuMaWelcomeScreenProps> = ({
  onQuickStart,
  onNewEvaluation,
  onDeleteAll,
  evaluationCount,
}) => {
  const quickStartCards: WelcomeCard[] = [
    {
      title: '快速薪资评估',
      description: '只需3个问题，快速了解您的薪资水平',
      icon: '💰',
      onClick: () => onQuickStart('simple', '薪资评估'),
    },
    {
      title: '工作强度测评',
      description: '评估您的工作强度和加班情况',
      icon: '⏰',
      onClick: () => onQuickStart('simple', '工作强度测评'),
    },
    {
      title: '全面职场测评',
      description: '12+个问题，全面分析您的职场处境',
      icon: '📊',
      onClick: () => onQuickStart('normal', '全面职场测评'),
    },
    {
      title: '心理健康评估',
      description: '关注职场压力和心理健康状况',
      icon: '🧠',
      onClick: () => onQuickStart('normal', '心理健康评估'),
    },
    {
      title: '成长空间分析',
      description: '分析您的职业发展和学习机会',
      icon: '📈',
      onClick: () => onQuickStart('normal', '成长空间分析'),
    },
    {
      title: '团队氛围评估',
      description: '评估团队文化和人际关系',
      icon: '🤝',
      onClick: () => onQuickStart('normal', '团队氛围评估'),
    },
  ]

  const handleDeleteAll = () => {
    // 直接调用父组件传入的删除函数，确认逻辑由父组件处理
    onDeleteAll()
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Logo 和标题 */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="text-6xl mb-4">🐂</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          牛马测评仪
        </h1>
        <p className="text-gray-600 text-lg">
          全面分析您的职场处境，AI 助您职业成长
        </p>
      </div>

      {/* 快速开始卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full mb-8">
        {quickStartCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-pink-200 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {card.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* 新建测评按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => onNewEvaluation('simple')}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg"
        >
          ⚡ 简易版测评
        </button>
        <button
          onClick={() => onNewEvaluation('normal')}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
        >
          📊 正常版测评
        </button>
      </div>

      {/* 删除所有测评 */}
      {evaluationCount > 0 && (
        <button
          onClick={handleDeleteAll}
          className="text-gray-500 hover:text-red-600 text-sm transition-colors"
        >
          删除所有测评记录
        </button>
      )}
    </div>
  )
}

export default NiuMaWelcomeScreen
