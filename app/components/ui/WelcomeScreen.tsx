'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface WelcomeScreenProps {
  user?: any
  onStartNewChat: (presetQuestion?: string) => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onStartNewChat }) => {
  const router = useRouter()



  const quickActions = [
    {
      title: '劳动合同问题',
      question: '我的劳动合同有哪些需要注意的地方？',
      icon: '📄'
    },
    {
      title: '工资纠纷',
      question: '公司拖欠工资，我应该怎么维权？',
      icon: '💰'
    },
    {
      title: '加班费计算',
      question: '如何正确计算加班费？',
      icon: '⏰'
    },
    {
      title: '工伤赔偿',
      question: '工伤认定标准和赔偿流程是什么？',
      icon: '🏥'
    },
    {
      title: '解除合同',
      question: '什么情况下可以合法解除劳动合同？',
      icon: '🚪'
    },
    {
      title: '社保问题',
      question: '公司不交社保，我该怎么办？',
      icon: '🛡️'
    }
  ]

  const [showCopyToast, setShowCopyToast] = React.useState(false)

  const handleQuickAction = async (question: string) => {
    try {
      await navigator.clipboard.writeText(question)
      setShowCopyToast(true)
      setTimeout(() => {
        setShowCopyToast(false)
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
      // 如果复制失败，可以回退到开始对话
      onStartNewChat(question)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl w-full px-6 py-12">
        {/* 主要欢迎区域 */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-48 h-48 mb-2">
              <img 
                src="/logo.jpeg" 
                alt="劳动法助手" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              欢迎使用劳动法智能助手
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {user ? `你好，${user.name || user.email}！` : '你好！'}
              我是您的专业劳动法咨询助手，随时为您提供专业的法律建议和解决方案。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onStartNewChat}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              💬 开始对话
            </button>
            <button
              onClick={() => router.push('/tools')}
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              🛠️ 使用工具
            </button>
          </div>
        </div>



        {/* 快速开始 */}
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            快速开始
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.question)}
                className="bg-white rounded-xl p-4 text-left shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">{action.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {action.question}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
            <span className="text-blue-600 text-sm">
              💡 点击"开始对话"立即咨询，或选择上方的常见问题复制到剪贴板
            </span>
          </div>
        </div>

        {/* 复制成功提示 */}
        {showCopyToast && (
          <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="font-medium">问题已复制到剪贴板</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WelcomeScreen