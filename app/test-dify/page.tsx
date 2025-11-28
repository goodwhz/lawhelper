'use client'

import { useState } from 'react'

export default function TestDifyPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDify = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: '你好，请简单介绍一下你的功能',
          response_mode: 'blocking',
          conversation_id: null,
          user: 'test_user',
          auto_generate_name: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(`✅ Dify连接成功！\n\n回复：${data.answer || '无回复内容'}\n\n消息ID: ${data.message_id || '无'}\n对话ID: ${data.conversation_id || '无'}`)
    } catch (error) {
      setResult(`❌ Dify连接失败：\n\n${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dify API 测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">配置信息</h2>
          <div className="space-y-2 text-sm">
            <div><strong>APP_ID:</strong> 5e18f32a-f037-4eb6-92fc-4fd1bb1b0923</div>
            <div><strong>APP_KEY:</strong> app-eNk3GtruKTh2pHmcBk7g6gs4</div>
            <div><strong>API_URL:</strong> https://dify.aipfuture.com/v1</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testDify}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '测试中...' : '测试Dify连接'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">测试结果</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}