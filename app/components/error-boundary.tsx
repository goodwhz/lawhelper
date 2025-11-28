'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // 检查是否是chunk加载错误
      if (this.state.error?.message?.includes('ChunkLoadError') || 
          this.state.error?.message?.includes('Loading chunk')) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  页面加载错误
                </h2>
                <p className="text-gray-600 mb-4">
                  页面资源加载失败，这通常是由于网络问题或缓存导致的。
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 transition-colors"
                  >
                    刷新页面
                  </button>
                  <button
                    onClick={() => {
                      // 清除可能的缓存问题
                      if ('caches' in window) {
                        caches.keys().then(names => {
                          names.forEach(name => {
                            caches.delete(name)
                          })
                        })
                      }
                      window.location.href = window.location.pathname
                    }}
                    className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    清除缓存并重试
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    返回首页
                  </button>
                </div>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    查看错误详情
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      }

      // 其他错误的fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              应用程序遇到了错误
            </h1>
            <p className="text-gray-600 mb-4">
              抱歉，应用程序遇到了一个意外错误。
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-law-red-500 text-white px-4 py-2 rounded-lg hover:bg-law-red-600 transition-colors"
              >
                刷新页面
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}