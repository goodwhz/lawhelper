import React from 'react'
import KnowledgeBase from '@/app/components/knowledge-base'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const KnowledgeBasePage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-white">
          <Navigation />
          
          {/* 主内容区域 */}
          <KnowledgeBase />
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default KnowledgeBasePage
