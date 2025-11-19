'use client'

import React, { useState } from 'react'

interface CompensationData {
  joinDate: string
  leaveDate: string
  avgSalary: number
  terminationReason: 'voluntary' | 'company' | 'illegal'
}

const CompensationCalculator: React.FC = () => {
  const [data, setData] = useState<CompensationData>({
    joinDate: '',
    leaveDate: '',
    avgSalary: 5000,
    terminationReason: 'voluntary',
  })

  const [result, setResult] = useState<{
    compensationType: string
    amount: number
    description: string
    workYears: number
    workMonths: number
  } | null>(null)

  const calculateCompensation = () => {
    if (!data.joinDate || !data.leaveDate) {
      // 使用更友好的提示方式替代 alert
      console.warn('请填写入职和离职日期')
      return
    }

    const joinDate = new Date(data.joinDate)
    const leaveDate = new Date(data.leaveDate)

    // 计算工作年限
    const diffTime = Math.abs(leaveDate.getTime() - joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const workYears = Math.floor(diffDays / 365)
    const workMonths = Math.floor((diffDays % 365) / 30)

    let compensationType = ''
    let amount = 0
    let description = ''

    if (data.terminationReason === 'voluntary') {
      compensationType = '无补偿'
      amount = 0
      description = '员工自愿离职，无经济补偿金'
    } else if (data.terminationReason === 'company') {
      compensationType = 'N'
      amount = data.avgSalary * workYears + (data.avgSalary / 12) * workMonths
      description = `公司解除劳动合同，经济补偿金为 ${amount.toFixed(2)} 元`
    } else if (data.terminationReason === 'illegal') {
      compensationType = '2N'
      amount = 2 * (data.avgSalary * workYears + (data.avgSalary / 12) * workMonths)
      description = `违法解除劳动合同，赔偿金为 ${amount.toFixed(2)} 元`
    }

    setResult({
      compensationType,
      amount: Number(amount.toFixed(2)),
      description,
      workYears,
      workMonths,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">赔偿计算器</h3>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              入职日期
            </label>
            <input
              type="date"
              value={data.joinDate}
              onChange={e => setData({ ...data, joinDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              离职日期
            </label>
            <input
              type="date"
              value={data.leaveDate}
              onChange={e => setData({ ...data, leaveDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            月平均工资（元）
          </label>
          <input
            type="number"
            value={data.avgSalary}
            onChange={e => setData({ ...data, avgSalary: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            离职原因
          </label>
          <select
            value={data.terminationReason}
            onChange={e => setData({ ...data, terminationReason: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="voluntary">员工自愿离职</option>
            <option value="company">公司解除合同</option>
            <option value="illegal">违法解除合同</option>
          </select>
        </div>

        <button
          onClick={calculateCompensation}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          计算赔偿金额
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">计算结果</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>工作年限：</span>
                <span className="font-medium">{result.workYears}年{result.workMonths}个月</span>
              </div>
              <div className="flex justify-between">
                <span>补偿类型：</span>
                <span className="font-medium">{result.compensationType}</span>
              </div>
              <div className="flex justify-between">
                <span>金额：</span>
                <span className="font-medium text-green-600">{result.amount} 元</span>
              </div>
              <div className="text-gray-600">
                {result.description}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <strong>法律依据：</strong>《劳动合同法》规定，经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。六个月以上不满一年的，按一年计算；不满六个月的，向劳动者支付半个月工资的经济补偿。
        </div>
      </div>
    </div>
  )
}

export default CompensationCalculator
