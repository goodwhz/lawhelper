// 内容管理相关的类型定义
export interface LegalDocument {
  id: string
  title: string
  content: string
  category_id: string | null
  author_id: string | null
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
  author?: {
    email: string
    full_name?: string
  }
  category?: {
    name: string
    description?: string
  }
}

export interface DocumentCategory {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  created_at: string
  parent?: DocumentCategory
  children?: DocumentCategory[]
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
  message_count: number
  user?: {
    email: string
    full_name?: string
  }
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

// 表单类型
export interface DocumentFormData {
  title: string
  content: string
  category_id: string
  tags: string
  published: boolean
}

export interface CategoryFormData {
  name: string
  description: string
  parent_id: string | null
}

// 搜索和过滤类型
export interface SearchFilters {
  query: string
  category?: string
  author?: string
  tags?: string[]
  published?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// 统计类型
export interface ContentStats {
  totalDocuments: number
  publishedDocuments: number
  totalCategories: number
  totalConversations: number
  totalMessages: number
  recentActivity: {
    date: string
    documents: number
    conversations: number
  }[]
}
