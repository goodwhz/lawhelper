import React from 'react'
import DebugChat from '@/app/components/chat/DebugChat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatDebugPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <DebugChat />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatDebugPage