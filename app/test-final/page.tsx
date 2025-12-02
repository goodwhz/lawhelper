'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (response.ok && data.success) {
        // 删除成功，清除本地状态
        await signOut()

        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError(data.error || '删除失败')
      }
    } catch (err: any) {
      setError(`请求失败: ${err.message}`)
    } finally {
      setLoading(false)
      setPassword('')
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setPassword('')
  }

  const testAdminKey = async () => {
    try {
      const response = await fetch('/api/test-admin-key')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(`测试失败: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 最终测试页面</h1>

        {/* 当前状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前状态</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>登录状态:</strong> {isAuthenticated ? '✅ 已登录' : '❌ 未登录'}</p>
              <p><strong>用户ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>邮箱:</strong> {user?.email || 'N/A'}</p>
            </div>
            <div>
              <p><strong>用户名:</strong> {user?.name || 'N/A'}</p>
              <p><strong>角色:</strong> {user?.role || 'N/A'}</p>
              <p><strong>创建时间:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">功能测试</h2>
          <div className="flex gap-4">
            <button
              onClick={testAdminKey}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              测试管理密钥
            </button>
            <button
              onClick={testDeleteAccount}
              disabled={loading || !isAuthenticated}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? '删除中...' : '删除账户'}
            </button>
          </div>
        </div>

        {/* 结果显示 */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            <strong>错误:</strong> {error}
          </div>
        )}

        {/* 说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 使用说明</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>点击"测试管理密钥"检查Service Role Key是否正常工作</li>
            <li>如果已登录，点击"删除账户"测试完整删除流程</li>
            <li>观察结果中的详细日志和错误信息</li>
            <li>成功删除后会自动跳转到首页</li>
          </ol>
        </div>
      </div>

      {/* 确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ 确认删除账户</h2>
            <p className="text-gray-600 mb-4">
              这将永久删除您的账户和所有相关数据。此操作不可逆转！
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请输入密码以确认删除：
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="请输入密码"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
