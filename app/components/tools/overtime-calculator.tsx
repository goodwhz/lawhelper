'use client'

import React, { useState } from 'react'

interface OvertimeData {
  baseSalary: number
  overtimeHours: number
  overtimeType: 'weekday' | 'weekend' | 'holiday'
}

const OvertimeCalculator: React.FC = () => {
  const [data, setData] = useState<OvertimeData>({
    baseSalary: 5000,
    overtimeHours: 10,
    overtimeType: 'weekday',
  })

  const [result, setResult] = useState<{
    hourlyRate: number
    overtimePay: number
    multiplier: number
  } | null>(null)

  const calculateOvertime = () => {
    const hourlyRate = data.baseSalary / 21.75 / 8 // 月薪 ÷ 21.75天 ÷ 8小时
    let multiplier = 1.5

    switch (data.overtimeType) {
      case 'weekend':
        multiplier = 2
        break
      case 'holiday':
        multiplier = 3
        break
      default:
        multiplier = 1.5
    }

    const overtimePay = hourlyRate * data.overtimeHours * multiplier

    setResult({
      hourlyRate: Number(hourlyRate.toFixed(2)),
      overtimePay: Number(overtimePay.toFixed(2)),
      multiplier,
    })
  }

  const getMultiplierText = () => {
    switch (data.overtimeType) {
      case 'weekday':
        return '工作日加班（1.5倍）'
      case 'weekend':
        return '休息日加班（2倍）'
      case 'holiday':
        return '法定节假日加班（3倍）'
      default:
        return ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">加班费计算器</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            月基本工资（元）
          </label>
          <input
            type="number"
            value={data.baseSalary}
            onChange={e => setData({ ...data, baseSalary: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            加班时长（小时）
          </label>
          <input
            type="number"
            value={data.overtimeHours}
            onChange={e => setData({ ...data, overtimeHours: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            加班类型
          </label>
          <select
            value={data.overtimeType}
            onChange={e => setData({ ...data, overtimeType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekday">工作日加班（1.5倍）</option>
            <option value="weekend">休息日加班（2倍）</option>
            <option value="holiday">法定节假日加班（3倍）</option>
          </select>
        </div>

        <button
          onClick={calculateOvertime}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          计算加班费
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">计算结果</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>小时工资：</span>
                <span className="font-medium">{result.hourlyRate} 元/小时</span>
              </div>
              <div className="flex justify-between">
                <span>加班类型：</span>
                <span className="font-medium">{getMultiplierText()}</span>
              </div>
              <div className="flex justify-between">
                <span>应得加班费：</span>
                <span className="font-medium text-green-600">{result.overtimePay} 元</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OvertimeCalculator
