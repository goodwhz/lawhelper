/**
 * 牛马测评仪类型定义
 * 参考智能核心的类型系统
 */

// =====================================================
// 数据库表类型
// =====================================================

/**
 * 测评对话状态
 */
export type EvaluationStatus = 'active' | 'archived' | 'deleted'

/**
 * 测评版本
 */
export type EvaluationVersion = 'simple' | 'normal'

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 测评对话表（niuma_evaluations）
 */
export interface Evaluation {
  id: string
  user_id: string
  version: EvaluationVersion
  title: string
  status: EvaluationStatus
  coze_conversation_id: string | null
  metadata: Record<string, any>
  settings: Record<string, any>
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 测评消息表（niuma_evaluation_messages）
 */
export interface EvaluationMessage {
  id: string
  evaluation_id: string
  user_id: string
  content: string
  role: MessageRole
  coze_message_id: string | null
  message_data: Record<string, any>
  feedback: Feedback | null
  created_at: string
  updated_at: string
}

/**
 * 测评结果表（niuma_evaluation_results）
 */
export interface EvaluationResult {
  id: string
  evaluation_id: string
  user_id: string
  total_score: number | null
  salary_score: number | null
  workload_score: number | null
  growth_score: number | null
  environment_score: number | null
  atmosphere_score: number | null
  mental_health_score: number | null
  evaluation_summary: string | null
  suggestions: string | null
  dimensions: Record<string, any>
  created_at: string
  updated_at: string
}

// =====================================================
// 反馈类型
// =====================================================

/**
 * 用户反馈类型
 */
export interface Feedback {
  liked?: boolean
  disliked?: boolean
  reason?: string
  timestamp?: string
}

// =====================================================
// API 请求/响应类型
// =====================================================

/**
 * 创建测评对话请求
 */
export interface CreateEvaluationInput {
  title?: string
  version: EvaluationVersion
  metadata?: Record<string, any>
  settings?: Record<string, any>
}

/**
 * 创建测评消息请求
 */
export interface CreateMessageInput {
  evaluation_id: string
  content: string
  role: MessageRole
  coze_message_id?: string
  message_data?: Record<string, any>
}

/**
 * 更新测评对话请求
 */
export interface UpdateEvaluationInput {
  title?: string
  status?: EvaluationStatus
  metadata?: Record<string, any>
  settings?: Record<string, any>
}

/**
 * 保存测评结果请求
 */
export interface CreateEvaluationResultInput {
  evaluation_id: string
  total_score?: number
  salary_score?: number
  workload_score?: number
  growth_score?: number
  environment_score?: number
  atmosphere_score?: number
  mental_health_score?: number
  evaluation_summary?: string
  suggestions?: string
  dimensions?: Record<string, any>
}

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 获取测评列表响应
 */
export interface GetEvaluationsResponse {
  evaluations: Evaluation[]
  count: number
}

/**
 * 获取测评详情响应
 */
export interface GetEvaluationDetailResponse {
  evaluation: Evaluation
  messages: EvaluationMessage[]
  result?: EvaluationResult
}

// =====================================================
// UI 组件类型
// =====================================================

/**
 * 消息气泡状态
 */
export interface MessageBubbleProps {
  message: EvaluationMessage
  isStreaming?: boolean
  onCopy?: () => void
  onLike?: () => void
  onDislike?: () => void
  onRegenerate?: () => void
}

/**
 * 对话卡片类型
 */
export interface EvaluationCard {
  evaluation: Evaluation
  lastMessage?: EvaluationMessage
  isSelected: boolean
  onClick: () => void
  onDelete?: () => void
  onEdit?: (newTitle: string) => void
}

/**
 * 欢迎界面快速问题卡片
 */
export interface WelcomeCard {
  title: string
  description: string
  icon: string
  onClick: () => void
}

// =====================================================
// Hook 返回类型
// =====================================================

/**
 * useNiuMaSupabaseChat Hook 返回类型
 */
export interface UseNiuMaSupabaseChatReturn {
  // 测评对话数据
  evaluations: Evaluation[]
  currentEvaluation: Evaluation | null
  messages: EvaluationMessage[]
  currentResult: EvaluationResult | null

  // 加载状态
  isLoading: boolean
  isLoadingMessages: boolean
  isLoadingResult: boolean

  // 错误状态
  error: string | null

  // 方法
  loadEvaluations: () => Promise<void>
  loadEvaluation: (evaluationId: string) => Promise<void>
  createEvaluation: (input: CreateEvaluationInput) => Promise<Evaluation | null>
  updateEvaluation: (evaluationId: string, input: UpdateEvaluationInput) => Promise<void>
  deleteEvaluation: (evaluationId: string) => Promise<void>
  deleteMultipleEvaluations: (evaluationIds: string[]) => Promise<void>

  sendMessage: (content: string, role?: MessageRole) => Promise<EvaluationMessage | null>
  saveMessage: (input: CreateMessageInput) => Promise<EvaluationMessage | null>
  updateMessage: (messageId: string, feedback?: Feedback) => Promise<void>

  saveResult: (input: CreateEvaluationResultInput) => Promise<EvaluationResult | null>
  loadResult: (evaluationId: string) => Promise<EvaluationResult | null>

  setCurrentEvaluation: (evaluation: Evaluation | null) => void
  refreshCurrentEvaluation: () => Promise<void>
}

// =====================================================
// 缓存类型
// =====================================================

/**
 * 消息缓存项
 */
export interface MessageCacheItem {
  messages: EvaluationMessage[]
  timestamp: number
  ttl: number
}

/**
 * 测评缓存项
 */
export interface EvaluationCacheItem {
  evaluations: Evaluation[]
  timestamp: number
  ttl: number
}
