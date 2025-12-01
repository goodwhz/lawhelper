import React from 'react'
import FixedChat from '@/app/components/chat/FixedChat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatFixedPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <FixedChat />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatFixedPage