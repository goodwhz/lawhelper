'use client'

import React, { useState, useEffect } from 'react'
import EvaluationHistoryList from '@/app/components/evaluation/EvaluationHistoryList'
import { safeGetUser, safeGetSession } from '@/lib/authUtils'

const EvaluationTestPage: React.FC = () => {
  const [userToken, setUserToken] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserToken = async () => {
      try {
        console.log('=== 测试页面:开始获取用户token ===')

        // 使用安全的函数获取用户
        const { user, error: userError } = await safeGetUser()
        console.log('safeGetUser result:', { user, userError })

        if (user) {
          // 使用安全的函数获取session
          const { session, error: sessionError } = await safeGetSession()
          console.log('safeGetSession result:', {
            hasSession: !!session,
            hasAccessToken: !!session?.access_token,
            sessionError,
          })

          if (session?.access_token) {
            setUserToken(session.access_token)
          }
        }
      } catch (error) {
        console.error('获取用户token失败:', error)
      } finally {
        setLoading(false)
      }
    }
    getUserToken()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!userToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">需要登录</h1>
          <p className="text-gray-600 mb-6">请先登录以查看测评历史</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EvaluationHistoryList
        userToken={userToken}
        onClose={() => window.location.href = '/niu-ma-evaluator'}
      />
    </div>
  )
}

export default EvaluationTestPage
