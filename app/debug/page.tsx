'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [_isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health-check')
        const data = await response.json()
        setHealthStatus(data)
      } catch (error) {
        console.error('Health check failed:', error)
        setHealthStatus({ error: 'Failed to fetch health status' })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  const _handleInitDatabase = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch('/api/init-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        console.log('数据库初始化成功！')
        // 重新检查健康状态
        const healthResponse = await fetch('/api/health-check')
        const healthData = await healthResponse.json()
        setHealthStatus(healthData)
      } else {
        console.error(`数据库初始化失败: ${data.error}`)
      }
    } catch (error) {
      console.error('Database initialization failed:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>正在检查系统状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">系统调试信息</h1>

        {healthStatus
          ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">健康检查结果</h2>

              <div className={`p-4 rounded-lg mb-4 ${
                healthStatus.status === 'healthy' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-semibold ${
                  healthStatus.status === 'healthy' ? 'text-green-800' : 'text-red-800'
                }`}>
                  状态: {healthStatus.status}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  检查时间: {healthStatus.timestamp}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">环境变量</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Supabase URL:</strong> {healthStatus.environment?.NEXT_PUBLIC_SUPABASE_URL || '未设置'}</p>
                    <p><strong>Supabase Key:</strong> {healthStatus.environment?.NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS ? '已设置' : '未设置'}</p>
                    <p><strong>Key Length:</strong> {healthStatus.environment?.NEXT_PUBLIC_SUPABASE_ANON_KEY_LENGTH || 0}</p>
                    <p><strong>Node Env:</strong> {healthStatus.environment?.NODE_ENV}</p>
                    <p><strong>Vercel Env:</strong> {healthStatus.environment?.VERCEL_ENV}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">数据库连接</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>连接状态:</strong> {healthStatus.supabase?.success ? '成功' : '失败'}</p>
                    {healthStatus.supabase?.error && (
                      <p className="text-red-600"><strong>错误:</strong> {healthStatus.supabase.error}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">数据库表</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>law_categories:</strong> {healthStatus.database?.categories ? '存在' : '不存在或无法访问'}</p>
                    <p><strong>law_documents:</strong> {healthStatus.database?.documents ? '存在' : '不存在或无法访问'}</p>
                  </div>
                </div>

                {healthStatus.recommendations && healthStatus.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">建议</h3>
                    <div className="bg-yellow-50 p-3 rounded text-sm">
                      {healthStatus.recommendations.map((rec: string, index: number) => (
                        <p key={index} className="text-yellow-800 mb-1">• {rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">快速测试</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => window.location.href = '/api/health-check'}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    测试 API 端点
                  </button>
                  <button
                    onClick={() => window.location.href = '/api/law-data'}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    测试数据 API
                  </button>
                  <button
                    onClick={() => window.location.href = '/api/test-db'}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    测试数据库连接
                  </button>
                </div>
              </div>
            </div>
          )
          : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">无法获取健康检查信息</p>
            </div>
          )}
      </div>
    </div>
  )
}
