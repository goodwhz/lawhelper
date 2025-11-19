'use client'

import React, { useState } from 'react'

interface AnnualLeaveData {
  totalWorkYears: number
  currentCompanyYears: number
}

const AnnualLeaveCalculator: React.FC = () => {
  const [data, setData] = useState<AnnualLeaveData>({
    totalWorkYears: 3,
    currentCompanyYears: 2,
  })

  const [result, setResult] = useState<{
    annualLeaveDays: number
    description: string
  } | null>(null)

  const calculateAnnualLeave = () => {
    let annualLeaveDays = 5 // 基本年假天数

    // 根据累计工作年限计算
    if (data.totalWorkYears >= 1 && data.totalWorkYears < 10) {
      annualLeaveDays = 5
    } else if (data.totalWorkYears >= 10 && data.totalWorkYears < 20) {
      annualLeaveDays = 10
    } else if (data.totalWorkYears >= 20) {
      annualLeaveDays = 15
    }

    // 根据在本单位工作年限计算（如果不满一年，按比例计算）
    if (data.currentCompanyYears < 1) {
      annualLeaveDays = Math.floor((data.currentCompanyYears * 12) * annualLeaveDays / 12)
    }

    let description = ''
    if (data.totalWorkYears < 1) {
      description = '工作不满1年，不享受带薪年假'
    } else if (data.currentCompanyYears < 1) {
      description = `在本单位工作${Math.floor(data.currentCompanyYears * 12)}个月，按比例享受年假`
    } else {
      description = `累计工作${data.totalWorkYears}年，享受法定年假`
    }

    setResult({
      annualLeaveDays,
      description,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">年假计算器</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            累计工作年限（年）
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={data.totalWorkYears}
            onChange={e => setData({ ...data, totalWorkYears: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            在本单位工作年限（年）
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={data.currentCompanyYears}
            onChange={e => setData({ ...data, currentCompanyYears: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={calculateAnnualLeave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          计算年假天数
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">计算结果</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>年假天数：</span>
                <span className="font-medium text-green-600">{result.annualLeaveDays} 天</span>
              </div>
              <div className="text-gray-600">
                {result.description}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <strong>法律依据：</strong>《职工带薪年休假条例》规定，职工累计工作已满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。
        </div>
      </div>
    </div>
  )
}

export default AnnualLeaveCalculator
