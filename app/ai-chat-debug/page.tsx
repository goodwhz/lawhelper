import React from 'react'
import DebugChatComponent from '@/app/components/chat/debug-index'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatDebugPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <DebugChatComponent />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatDebugPage