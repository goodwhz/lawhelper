// 测评历史记录类型定义
export interface EvaluationHistory {
  id: string
  user_id: string
  title: string
  evaluation_date: string
  total_score: number
  salary_score?: number
  workload_score?: number
  growth_score?: number
  environment_score?: number
  atmosphere_score?: number
  mental_health_score?: number
  evaluation_summary?: string
  suggestions?: string[]
  chat_history?: any
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// 创建测评记录的输入类型
export interface CreateEvaluationInput {
  title: string
  total_score: number
  salary_score?: number
  workload_score?: number
  growth_score?: number
  environment_score?: number
  atmosphere_score?: number
  mental_health_score?: number
  evaluation_summary?: string
  suggestions?: string[]
  chat_history?: any
  metadata?: Record<string, any>
}

// 更新测评记录的输入类型
export interface UpdateEvaluationInput extends Partial<CreateEvaluationInput> {
  id: string
}

// 从Coze响应中提取的测评数据结构
export interface EvaluationDataFromCoze {
  total_score: number
  dimensions?: {
    薪资回报?: { score: number, factors?: string[] }
    工作强度?: { score: number, factors?: string[] }
    成长空间?: { score: number, factors?: string[] }
    工作环境?: { score: number, factors?: string[] }
    团队氛围?: { score: number, factors?: string[] }
    心理健康?: { score: number, factors?: string[] }
  }
  summary?: string
  suggestions?: string[]
}

// 趋势图数据类型
export interface TrendDataPoint {
  date: string
  total_score: number
  label: string
}

export interface DimensionTrendData {
  date: string
  total_score: number
  薪资回报?: number
  工作强度?: number
  成长空间?: number
  工作环境?: number
  团队氛围?: number
  心理健康?: number
}
