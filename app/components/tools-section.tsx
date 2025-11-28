'use client'
import type { FC } from 'react'
import React, { useState, lazy, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// 使用动态导入来避免潜在的模块加载问题
const CompensationCalculator = lazy(() => import('@/app/components/tools/compensation-calculator'))
const OvertimeCalculator = lazy(() => import('@/app/components/tools/overtime-calculator'))
const AnnualLeaveCalculator = lazy(() => import('@/app/components/tools/annual-leave-calculator'))
const ContractGenerator = lazy(() => import('@/app/components/tools/contract-generator'))

const ToolsSection: FC = () => {
  const [activeTool, setActiveTool] = useState('compensation')
  const { checkAndRequireAuth } = useAuth()

  const tools = [
    { id: 'compensation', name: '赔偿计算器', icon: '💰', description: '计算经济补偿金/赔偿金' },
    { id: 'overtime', name: '加班费计算器', icon: '⏰', description: '计算各类加班费用' },
    { id: 'annual-leave', name: '年假计算器', icon: '🏖️', description: '计算带薪年假天数' },
    { id: 'contract', name: '合同生成器', icon: '📝', description: '生成劳动合同模板' },

  ]

  const renderTool = () => {
    switch (activeTool) {
      case 'compensation':
        return (
          <Suspense fallback={<div>加载赔偿计算器...</div>}>
            <CompensationCalculator />
          </Suspense>
        )
      case 'overtime':
        return (
          <Suspense fallback={<div>加载加班费计算器...</div>}>
            <OvertimeCalculator />
          </Suspense>
        )
      case 'annual-leave':
        return (
          <Suspense fallback={<div>加载年假计算器...</div>}>
            <AnnualLeaveCalculator />
          </Suspense>
        )
      case 'contract':
        return (
          <Suspense fallback={<div>加载合同生成器...</div>}>
            <ContractGenerator />
          </Suspense>
        )

      default:
        return (
          <Suspense fallback={<div>加载赔偿计算器...</div>}>
            <CompensationCalculator />
          </Suspense>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-3xl font-bold text-law-red-800 mb-2">
              🛠️ 劳动法工具箱
            </h2>
            <p className="text-law-blue-700">
              专业的劳动法计算工具，帮助您快速解决常见法律计算问题
            </p>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* 工具导航 */}
            <div className="lg:w-64 bg-white p-4 border-r border-gray-200">
              <div className="space-y-2">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (checkAndRequireAuth()) {
                        setActiveTool(tool.id)
                      }
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all duration-200
                      ${activeTool === tool.id
                    ? 'bg-gray-100 text-gray-700 border-l-4 border-gray-400'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <div className="font-semibold">{tool.name}</div>
                        <div className="text-sm text-gray-500">{tool.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 工具内容 */}
            <div className="flex-1 p-6">
              {renderTool()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolsSection
