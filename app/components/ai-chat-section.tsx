'use client'
import type { FC } from 'react'
import React from 'react'
import Main from '@/app/components'

const AIChatSection: FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-law-red-800 mb-2">
              🤖 CoolBrain-LaborLawhelper
            </h2>
            <p className="text-gray-900">
              专业的劳动法智能咨询，24小时为您解答劳动法相关问题
            </p>
          </div>

          {/* 优化聊天窗口布局 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Main params={{}} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">💡 常见问题</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                试用期被辞退有补偿吗？
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                加班费如何计算？
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                年假天数怎么确定？
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                工伤认定流程是什么？
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">⚖️ 法律咨询</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                劳动合同纠纷
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                工资支付争议
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                社保缴纳问题
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                劳动争议仲裁
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">📋 文书指导</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                劳动合同模板
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                辞职信范本
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                仲裁申请书
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                解除通知模板
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChatSection
