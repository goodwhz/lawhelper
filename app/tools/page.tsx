'use client'

import React from 'react'
import ToolsSection from '@/app/components/tools-section'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const ToolsPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          <Navigation />
          
          {/* 主内容区域 */}
          <ToolsSection />
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default ToolsPage
