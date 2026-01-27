-- 创建牛马测评仪历史记录表
CREATE TABLE IF NOT EXISTS evaluation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_score DECIMAL(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  salary_score DECIMAL(5,2),
  workload_score DECIMAL(5,2),
  growth_score DECIMAL(5,2),
  environment_score DECIMAL(5,2),
  atmosphere_score DECIMAL(5,2),
  mental_health_score DECIMAL(5,2),
  evaluation_summary TEXT,
  suggestions TEXT[],
  chat_history JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_evaluation_history_user_id ON evaluation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_history_created_at ON evaluation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluation_history_user_date ON evaluation_history(user_id, created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluation_history_updated_at
  BEFORE UPDATE ON evaluation_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE evaluation_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 1. 用户只能查看自己的测评记录
CREATE POLICY "Users can view own evaluations"
  ON evaluation_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. 用户可以创建自己的测评记录
CREATE POLICY "Users can create own evaluations"
  ON evaluation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 用户可以删除自己的测评记录
CREATE POLICY "Users can delete own evaluations"
  ON evaluation_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 用户可以更新自己的测评记录
CREATE POLICY "Users can update own evaluations"
  ON evaluation_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 添加注释
COMMENT ON TABLE evaluation_history IS '牛马测评仪历史记录表';
COMMENT ON COLUMN evaluation_history.user_id IS '用户ID，关联auth.users表';
COMMENT ON COLUMN evaluation_history.title IS '测评标题';
COMMENT ON COLUMN evaluation_history.evaluation_date IS '测评日期';
COMMENT ON COLUMN evaluation_history.total_score IS '综合评分(0-100)';
COMMENT ON COLUMN evaluation_history.salary_score IS '薪资回报评分';
COMMENT ON COLUMN evaluation_history.workload_score IS '工作强度评分';
COMMENT ON COLUMN evaluation_history.growth_score IS '成长空间评分';
COMMENT ON COLUMN evaluation_history.environment_score IS '工作环境评分';
COMMENT ON COLUMN evaluation_history.atmosphere_score IS '团队氛围评分';
COMMENT ON COLUMN evaluation_history.mental_health_score IS '心理健康评分';
COMMENT ON COLUMN evaluation_history.evaluation_summary IS '测评总结';
COMMENT ON COLUMN evaluation_history.suggestions IS '建议列表';
COMMENT ON COLUMN evaluation_history.chat_history IS '聊天历史记录';
COMMENT ON COLUMN evaluation_history.metadata IS '额外元数据(如行业、职级等)';
