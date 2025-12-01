'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ConnectionStatus {
  timestamp: string
  server: {
    status: string
    node_version: string
    next_version: string
  }
  database: {
    status: string
    error?: string | null
    data?: string
  }
  environment: {
    status: string
    error?: string | null
    data?: string
  }
  dify: {
    status: string
    error?: string | null
    data?: string
  }
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/connection-test')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('连接检查失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setTestResult('正在测试...')
      
      const response = await fetch('/api/connection-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          message: '前后端连接测试',
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (response.ok && data.status === 'ok') {
        setTestResult(`✅ 连接测试成功! ${data.message}`)
      } else {
        setTestResult(`❌ 连接测试失败: ${data.message}`)
      }
    } catch (error) {
      setTestResult(`❌ 连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在检查连接状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">前后端连接状态</h1>
          
          {/* 连接测试按钮 */}
          <div className="mb-6 text-center">
            <button
              onClick={testConnection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              测试连接
            </button>
            <button
              onClick={checkConnection}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              刷新状态
            </button>
            {testResult && (
              <div className={`mt-4 p-3 rounded ${
                testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResult}
              </div>
            )}
          </div>

          {/* 状态详情 */}
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 服务器状态 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">服务器状态</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      status.server.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.server.status === 'ok' ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node.js:</span>
                    <span className="text-sm text-gray-600">{status.server.node_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next.js:</span>
                    <span className="text-sm text-gray-600">{status.server.next_version}</span>
                  </div>
                </div>
              </div>

              {/* 数据库状态 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">数据库状态</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      status.database.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.database.status === 'ok' ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {status.database.error || status.database.data || '未知状态'}
                  </div>
                </div>
              </div>

              {/* 环境变量状态 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">环境配置</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      status.environment.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.environment.status === 'ok' ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {status.environment.error || status.environment.data || '未知状态'}
                  </div>
                </div>
              </div>

              {/* Dify状态 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">Dify AI 状态</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      status.dify.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.dify.status === 'ok' ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {status.dify.error || status.dify.data || '未知状态'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 总体状态 */}
          {status && (
            <div className="mt-6 p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-2">总体状态</h3>
              <div className={`text-lg font-semibold ${
                status.server.status === 'ok' && 
                status.database.status === 'ok' && 
                status.environment.status === 'ok' && 
                status.dify.status === 'ok'
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.server.status === 'ok' && 
                 status.database.status === 'ok' && 
                 status.environment.status === 'ok' && 
                 status.dify.status === 'ok'
                  ? '✅ 所有连接正常' : '❌ 存在连接问题'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                最后更新: {new Date(status.timestamp).toLocaleString()}
              </p>
            </div>
          )}

          {/* 导航按钮 */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => router.push('/ai-chat')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              AI聊天
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}