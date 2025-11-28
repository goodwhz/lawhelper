import React from 'react'
import ChatComponent from '@/app/components/chat'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <ChatComponent />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatPage
