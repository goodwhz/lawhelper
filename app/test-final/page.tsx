'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'

export default function TestFinalPage() {
  const { user, isAuthenticated, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [password, setPassword] = useState('')

  const testDeleteAccount = async () => {
    if (!user?.email) {
      setError('请先登录')
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!password) {
      setError('请输入密码')
      return
    }

    setShowConfirmDialog(false)
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/test/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || '账户删除测试成功',
          details: data
        })
        setPassword('')
        
        // 如果是模拟删除，不实际登出
        if (!data.simulated) {
          setTimeout(() => {
            signOut()
          }, 2000)
        }
      } else {
        throw new Error(data.error || '删除测试失败')
      }
    } catch (error: any) {
      setError(error.message || '删除测试失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端页面头部 */}
      <MobilePageHeader title="测试页面" />
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🔧 最终测试页面</h1>

          {/* 当前状态 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">当前状态</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">认证状态:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isAuthenticated ? '已认证' : '未认证'}
                </span>
              </div>
              <div>
                <span className="font-medium">用户邮箱:</span>
                <span className="ml-2">{user?.email || '无'}</span>
              </div>
            </div>
          </div>

          {/* 账户删除测试 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 mb-4">🗑️ 账户删除功能测试</h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ 警告</h3>
                <p className="text-yellow-700 text-sm">
                  这是一个测试功能，用于验证账户删除 API 的功能。实际删除操作将：
                </p>
                <ul className="mt-2 list-disc list-inside text-yellow-700 text-sm space-y-1">
                  <li>删除用户认证信息</li>
                  <li>删除用户相关的所有对话记录</li>
                  <li>清除用户数据和缓存</li>
                  <li>此操作不可撤销</li>
                </ul>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={testDeleteAccount}
                  disabled={loading || !isAuthenticated}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? '测试中...' : '开始删除测试'}
                </button>
                
                {!isAuthenticated && (
                  <span className="text-sm text-gray-500">请先登录</span>
                )}
              </div>
            </div>
          </div>

          {/* 测试结果 */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-green-800 mb-3">✅ 测试结果</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">状态:</span>
                  <span className="ml-2 text-green-700">{result.message}</span>
                </div>
                {result.details && (
                  <div className="text-sm text-gray-600">
                    <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-red-800 mb-2">❌ 错误</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 操作说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-3">📋 操作说明</h3>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <span>确保已登录测试账户</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <span>点击"开始删除测试"按钮</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <span>在弹出的确认对话框中输入密码</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <span>确认删除操作</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">5.</span>
                <span>查看测试结果和详细信息</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              确认删除测试
            </h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  您即将测试删除账户 <strong>{user?.email}</strong>。
                  在实际环境中，这将永久删除您的所有数据。
                </p>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  请输入密码确认:
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="输入密码"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleConfirmDelete()}
                  disabled={!password || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? '处理中...' : '确认删除'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDialog(false)
                    setPassword('')
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}