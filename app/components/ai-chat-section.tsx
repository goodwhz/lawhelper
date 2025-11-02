'use client'
import type { FC } from 'react'
import React from 'react'
import Main from '@/app/components'

const AIChatSection: FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🤖 AI劳动法助手
        </h2>
        <p className="text-gray-600">
          专业的劳动法智能咨询，24小时为您解答劳动法相关问题
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden mb-6">
        <Main params={{}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">💡 常见问题</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• 试用期被辞退有补偿吗？</li>
            <li>• 加班费如何计算？</li>
            <li>• 年假天数怎么确定？</li>
            <li>• 工伤认定流程是什么？</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">⚖️ 法律咨询</h3>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• 劳动合同纠纷</li>
            <li>• 工资支付争议</li>
            <li>• 社保缴纳问题</li>
            <li>• 劳动争议仲裁</li>
          </ul>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">📋 文书指导</h3>
          <ul className="text-sm text-purple-600 space-y-1">
            <li>• 劳动合同模板</li>
            <li>• 辞职信范本</li>
            <li>• 仲裁申请书</li>
            <li>• 解除通知模板</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AIChatSection
