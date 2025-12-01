import React from 'react'
import SimpleChat from '@/app/components/chat/SimpleChat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatSimplePage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <SimpleChat />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatSimplePage