'use client'

import React, { useState, useEffect } from 'react'

interface DiagnosticData {
  environment: any
  database: any
  errors: string[]
}

export default function DebugPage() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    try {
      setLoading(true)

      // 运行所有诊断测试
      const [
        envResponse,
        dbResponse,
        healthResponse,
        diagnoseResponse,
      ] = await Promise.all([
        fetch('/api/diagnose').then(r => r.json()),
        fetch('/api/check-db').then(r => r.json()),
        fetch('/api/health').then(r => r.json()),
        fetch('/api/test-supabase').then(r => r.json()),
      ])

      setDiagnosticData({
        environment: envResponse,
        database: dbResponse,
        errors: [
          !envResponse.success ? `环境变量: ${envResponse.error}` : null,
          !dbResponse.success ? `数据库: ${dbResponse.error}` : null,
          !healthResponse.success ? `健康检查: ${healthResponse.error}` : null,
          !diagnoseResponse.success ? `诊断: ${diagnoseResponse.error}` : null,
        ].filter(Boolean) as string[],
      })
    } catch (error: any) {
      setDiagnosticData({
        environment: null,
        database: null,
        errors: [`诊断失败: ${error.message}`],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在运行诊断测试...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">系统诊断报告</h1>
            <p className="text-gray-600">诊断时间: {new Date().toLocaleString('zh-CN')}</p>
          </div>

          {/* 错误概览 */}
          {diagnosticData?.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">发现的问题</h3>
              <ul className="list-disc list-inside text-red-700">
                {diagnosticData.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 环境变量诊断 */}
          {diagnosticData?.environment && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">环境变量诊断</h3>
              <div className={`p-4 rounded-lg ${diagnosticData.environment.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(diagnosticData.environment, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 数据库诊断 */}
          {diagnosticData?.database && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">数据库结构诊断</h3>
              <div className={`p-4 rounded-lg ${diagnosticData.database.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(diagnosticData.database, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              className="bg-law-red-600 text-white px-4 py-2 rounded-lg hover:bg-law-red-700 transition-colors"
            >
              重新运行诊断
            </button>
            <button
              onClick={() => window.location.href = '/knowledge-base'}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回知识库
            </button>
          </div>

          {/* 建议修复方案 */}
          {diagnosticData?.errors.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">建议修复方案</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-2">
                <li>检查 Vercel 环境变量是否正确设置</li>
                <li>确认 Supabase 项目是否正常运行</li>
                <li>检查数据库表是否存在且有正确的 RLS 策略</li>
                <li>验证 API 密钥是否有效</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
