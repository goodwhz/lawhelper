-- 牛马测评仪数据库表结构
-- 参考智能核心的表结构设计

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 表 1: niuma_evaluations (测评对话表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL DEFAULT 'normal' CHECK (version IN ('simple', 'normal')),
  title TEXT NOT NULL DEFAULT '新测评',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  coze_conversation_id TEXT,  -- 关联Coze对话ID（如果使用Coze API）
  metadata JSONB DEFAULT '{}',  -- 额外的元数据
  settings JSONB DEFAULT '{}',  -- 测评设置
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 表 2: niuma_evaluation_messages (测评消息表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.niuma_evaluations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  coze_message_id TEXT,  -- Coze消息ID（如果使用Coze API）
  message_data JSONB DEFAULT '{}',  -- 消息附加数据
  feedback JSONB,  -- 用户反馈（点赞/点踩）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 表 3: niuma_evaluation_results (测评结果表)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.niuma_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.niuma_evaluations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_score DECIMAL(5,2),  -- 综合评分
  salary_score DECIMAL(5,2),  -- 薪资回报得分
  workload_score DECIMAL(5,2),  -- 工作强度得分
  growth_score DECIMAL(5,2),  -- 成长空间得分
  environment_score DECIMAL(5,2),  -- 工作环境得分
  atmosphere_score DECIMAL(5,2),  -- 团队氛围得分
  mental_health_score DECIMAL(5,2),  -- 心理健康得分
  evaluation_summary TEXT,  -- 测评总结
  suggestions TEXT,  -- 改进建议
  dimensions JSONB DEFAULT '{}',  -- 各维度详细数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 索引优化
-- =====================================================

-- niuma_evaluations 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_user_id
  ON public.niuma_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_status
  ON public.niuma_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_version
  ON public.niuma_evaluations(version);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluations_updated_at
  ON public.niuma_evaluations(updated_at DESC);

-- niuma_evaluation_messages 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_evaluation_id
  ON public.niuma_evaluation_messages(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_user_id
  ON public.niuma_evaluation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_messages_created_at
  ON public.niuma_evaluation_messages(created_at DESC);

-- niuma_evaluation_results 表索引
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_results_evaluation_id
  ON public.niuma_evaluation_results(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_niuma_evaluation_results_user_id
  ON public.niuma_evaluation_results(user_id);

-- =====================================================
-- Row Level Security (RLS) 安全策略
-- =====================================================

-- 启用 RLS
ALTER TABLE public.niuma_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niuma_evaluation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niuma_evaluation_results ENABLE ROW LEVEL SECURITY;

-- niuma_evaluations 表策略
CREATE POLICY "用户可以查看自己的测评"
  ON public.niuma_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评"
  ON public.niuma_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评"
  ON public.niuma_evaluations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的测评"
  ON public.niuma_evaluations FOR DELETE
  USING (auth.uid() = user_id);

-- niuma_evaluation_messages 表策略
CREATE POLICY "用户可以查看自己的测评消息"
  ON public.niuma_evaluation_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评消息"
  ON public.niuma_evaluation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评消息"
  ON public.niuma_evaluation_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- niuma_evaluation_results 表策略
CREATE POLICY "用户可以查看自己的测评结果"
  ON public.niuma_evaluation_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的测评结果"
  ON public.niuma_evaluation_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的测评结果"
  ON public.niuma_evaluation_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 触发器：自动更新 updated_at 字段
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_niuma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER niuma_evaluations_updated_at
  BEFORE UPDATE ON public.niuma_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

CREATE TRIGGER niuma_evaluation_messages_updated_at
  BEFORE UPDATE ON public.niuma_evaluation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

CREATE TRIGGER niuma_evaluation_results_updated_at
  BEFORE UPDATE ON public.niuma_evaluation_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_niuma_updated_at();

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE public.niuma_evaluations IS '牛马测评仪-测评对话表';
COMMENT ON TABLE public.niuma_evaluation_messages IS '牛马测评仪-测评消息表';
COMMENT ON TABLE public.niuma_evaluation_results IS '牛马测评仪-测评结果表';

COMMENT ON COLUMN public.niuma_evaluations.version IS '测评版本: simple(简易版) 或 normal(正常版)';
COMMENT ON COLUMN public.niuma_evaluations.coze_conversation_id IS 'Coze API对话ID（如果使用）';
COMMENT ON COLUMN public.niuma_evaluation_messages.coze_message_id IS 'Coze消息ID（如果使用）';
COMMENT ON COLUMN public.niuma_evaluation_results.total_score IS '综合评分（0-100）';
