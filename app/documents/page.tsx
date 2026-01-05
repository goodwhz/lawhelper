'use client'

import type { FC } from 'react'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/navigation'
import MobilePageHeader from '@/app/components/ui/MobilePageHeader'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const DocumentsPage: FC = () => {
  const router = useRouter()

  useEffect(() => {
    // 自动跳转到劳动工具箱
    router.replace('/tools')
  }, [router])

  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200">
          {/* 桌面端导航 */}
          <Navigation />

          {/* 移动端页面头部 */}
          <MobilePageHeader title="文书模板库" />

          <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-purple-800 mb-2">
                    📄 正在跳转...
                  </h2>
                  <p className="text-purple-700">
                    文书模板库已整合到劳动法工具箱，即将为您跳转
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center">
                  <p className="text-gray-600">如果没有自动跳转，请点击下方按钮：</p>
                  <button
                    onClick={() => router.push('/tools')}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    前往劳动法工具箱
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default DocumentsPage
