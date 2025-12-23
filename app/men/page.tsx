'use client'

import React, { useState } from 'react'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

// 定义讯飞虚拟人接口请求参数类型
interface XunfeiVirtualHumanRequest {
  serviceId: string
  appId: string
  apiKey: string
  apiSecret: string
  virtualHumanId: string
  virtualHumanName: string
  voiceName: string
  voiceVcn: string
  textContent: string
}

// 定义接口响应类型
interface XunfeiVirtualHumanResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  audioUrl?: string
  videoUrl?: string
}

const MenPage: React.FC = () => {
  const [textContent, setTextContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<XunfeiVirtualHumanResponse | null>(null)

  // 讯飞虚拟人配置信息
  const xunfeiConfig = {
    serviceId: '259567848681246720',
    appId: 'b20ae552',
    apiKey: 'd046679b7afde2f1cb3022612959e818',
    apiSecret: 'YTVlMTJmNTliYTM4MmQwOGM0ZTQzMzVi',
    virtualHumanId: '110026013',
    virtualHumanName: '伊凡',
    voiceName: '超哥4.0',
    voiceVcn: 'x4_chaoge'
  }

  // 调用讯飞虚拟人接口函数
  const callXunfeiVirtualHuman = async () => {
    if (!textContent.trim()) {
      setResponse({
        success: false,
        error: '请输入要合成的文本内容'
      })
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      // 构建请求参数
      const requestData: XunfeiVirtualHumanRequest = {
        ...xunfeiConfig,
        textContent: textContent.trim()
      }

      // 调用接口
      const result = await fetch('/api/men', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const responseData = await result.json()
      
      if (result.ok) {
        setResponse({
          success: true,
          data: responseData.data,
          message: responseData.message,
          audioUrl: responseData.audioUrl,
          videoUrl: responseData.videoUrl
        })
      } else {
        setResponse({
          success: false,
          error: responseData.error || '接口调用失败'
        })
      }
    } catch (error) {
      console.error('接口调用错误:', error)
      setResponse({
        success: false,
        error: '网络请求失败，请检查网络连接'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    callXunfeiVirtualHuman()
  }

  // 播放音频函数
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play().catch(error => {
      console.error('播放音频失败:', error)
      setResponse({
        success: false,
        error: '音频播放失败，请检查音频链接'
      })
    })
  }

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          <Navigation />
          
          <div className="pt-24 pb-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* 页面标题 */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">讯飞虚拟人接口服务</h1>
                <p className="mt-2 text-gray-600">调用讯飞虚拟人API生成语音和视频内容</p>
              </div>

              {/* 输入表单 */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
                      文本内容
                    </label>
                    <textarea
                      id="textContent"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入要合成的文本内容..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '处理中...' : '生成虚拟人内容'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 响应显示 */}
              {response && (
                <div className={`p-6 rounded-lg ${
                  response.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`text-lg font-medium mb-2 ${
                    response.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {response.success ? '调用成功' : '调用失败'}
                  </h3>
                  
                  {response.message && (
                    <p className="text-gray-700 mb-3">{response.message}</p>
                  )}
                  
                  {response.audioUrl && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">音频内容：</h4>
                      <div className="flex items-center space-x-4">
                        <audio controls className="w-64">
                          <source src={response.audioUrl} type="audio/mpeg" />
                          您的浏览器不支持音频播放
                        </audio>
                        <button
                          onClick={() => playAudio(response.audioUrl!)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          播放音频
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {response.videoUrl && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">视频内容：</h4>
                      <video controls className="w-full max-w-md">
                        <source src={response.videoUrl} type="video/mp4" />
                        您的浏览器不支持视频播放
                      </video>
                    </div>
                  )}
                  
                  {response.data && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">响应数据：</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {response.error && (
                    <p className="text-red-700">{response.error}</p>
                  )}
                </div>
              )}

              {/* 虚拟人信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-medium text-blue-800 mb-4">虚拟人配置信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">虚拟人名称:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.virtualHumanName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">虚拟人ID:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.virtualHumanId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">声音名称:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.voiceName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">声音VCN:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.voiceVcn}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">服务ID:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.serviceId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">AppID:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.appId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">API Key:</span>
                    <span className="ml-2 text-gray-600">{xunfeiConfig.apiKey}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">API Secret:</span>
                    <span className="ml-2 text-gray-600">************</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default MenPage