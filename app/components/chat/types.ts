export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  conversation_id?: string
  user_id?: string
  content: string
  role: MessageRole
  created_at: string
  updated_at: string
  dify_message_id?: string
  feedback?: {
    rating?: 'like' | 'dislike'
    reason?: string
  }
  message_files?: Array<{
    type: string
    url: string
    name: string
  }>
  agent_thoughts?: Array<{
    id: string
    content: string
    position: number
  }>
  citation?: Array<{
    document_id: string
    content: string
    page_number?: number
  }>
  more?: Record<string, any>
  annotation?: any
  is_opening_statement?: boolean
  loading?: boolean // 用于流式加载状态
}

export interface Conversation {
  id: string
  user_id?: string
  title: string
  introduction?: string
  suggested_questions?: string[]
  inputs?: Record<string, any>
  is_pinned?: boolean
  dify_conversation_id?: string
  created_at: string
  updated_at: string
  description?: string
  status?: 'active' | 'paused' | 'archived' | 'deleted'
  settings?: Record<string, any>
  metadata?: Record<string, any>
  last_activity_at?: string
}

export interface ChatState {
  messages: ChatMessage[]
  currentConversation: Conversation | null
  isLoading: boolean
  isStreaming: boolean
  error: string | null
}

export interface ChatActions {
  loadConversation: (conversationId?: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  regenerateResponse: (messageId: string) => Promise<void>
  rateMessage: (messageId: string, rating: 'like' | 'dislike', reason?: string) => Promise<void>
  createNewConversation: (title?: string) => Promise<void>
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
}