import { Metadata } from 'next'
import EnhancedChatComponent from '@/app/components/chat-enhanced'

export const metadata: Metadata = {
  title: 'AI法律助手 - 支持对话历史 | 法律助手',
  description: '专业劳动法AI助手，支持Markdown格式化输出和完整的对话历史管理功能，包括保存、删除、切换会话等。',
}

export default function AIChatHistoryPage() {
  return (
    <div className="h-screen">
      <EnhancedChatComponent />
    </div>
  )
}