import React from 'react'
import MarkdownChatComponent from '@/app/components/chat-markdown'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const AiChatMarkdownPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <MarkdownChatComponent />
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default AiChatMarkdownPage