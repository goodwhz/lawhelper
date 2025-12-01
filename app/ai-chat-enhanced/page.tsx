import React from 'react'
import EnhancedChatComponent from '@/app/components/chat-enhanced'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatEnhancedPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <EnhancedChatComponent />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatEnhancedPage