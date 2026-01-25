-- Coze 会话表
-- 用于存储 Coze Bot 对话会话信息

CREATE TABLE IF NOT EXISTS coze_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_coze_sessions_user_id ON coze_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_sessions_last_activity ON coze_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_coze_sessions_status ON coze_sessions(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_coze_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coze_sessions_updated_at_trigger
BEFORE UPDATE ON coze_sessions
FOR EACH ROW
EXECUTE FUNCTION update_coze_sessions_updated_at();

-- Coze 消息历史表
-- 用于存储 Coze 对话消息历史
CREATE TABLE IF NOT EXISTS coze_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES coze_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_coze_messages_session_id ON coze_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_coze_messages_created_at ON coze_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coze_messages_role ON coze_messages(role);

-- Coze 连接日志表
-- 用于记录连接状态和错误信息
CREATE TABLE IF NOT EXISTS coze_connection_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES coze_sessions(id) ON DELETE SET NULL,
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('connect', 'disconnect', 'error', 'heartbeat', 'reconnect')),
  status VARCHAR(50) NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_coze_connection_logs_session_id ON coze_connection_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_coze_connection_logs_user_id ON coze_connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_connection_logs_event_type ON coze_connection_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_coze_connection_logs_created_at ON coze_connection_logs(created_at DESC);

-- 启用行级安全 (RLS)
ALTER TABLE coze_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coze_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coze_connection_logs ENABLE ROW LEVEL SECURITY;

-- coze_sessions 表的策略
-- 允许匿名用户读取自己的会话
CREATE POLICY "Users can view their own sessions"
ON coze_sessions FOR SELECT
USING (user_id = auth.uid()::TEXT OR user_id IS NULL);

-- 允许服务端角色完全访问
CREATE POLICY "Service role can manage sessions"
ON coze_sessions FOR ALL
USING (auth.role() = 'service_role');

-- coze_messages 表的策略
CREATE POLICY "Users can view messages from their sessions"
ON coze_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coze_sessions
    WHERE coze_sessions.id = coze_messages.session_id
    AND (coze_sessions.user_id = auth.uid()::TEXT OR coze_sessions.user_id IS NULL)
  )
);

-- 允许服务端角色完全访问
CREATE POLICY "Service role can manage messages"
ON coze_messages FOR ALL
USING (auth.role() = 'service_role');

-- coze_connection_logs 表的策略
CREATE POLICY "Users can view their own connection logs"
ON coze_connection_logs FOR SELECT
USING (user_id = auth.uid()::TEXT OR user_id IS NULL);

-- 允许服务端角色完全访问
CREATE POLICY "Service role can manage connection logs"
ON coze_connection_logs FOR ALL
USING (auth.role() = 'service_role');

-- 创建清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_coze_sessions()
RETURNS void AS $$
BEGIN
  -- 删除超过 24 小时的过期会话
  DELETE FROM coze_sessions
  WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '24 hours';

  -- 更新超过 2 小时未活跃的会话为过期状态
  UPDATE coze_sessions
  SET status = 'expired',
    updated_at = NOW()
  WHERE status = 'active'
  AND last_activity < NOW() - INTERVAL '2 hours';

  -- 删除超过 7 天的连接日志
  DELETE FROM coze_connection_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 创建清理过期消息的函数
CREATE OR REPLACE FUNCTION cleanup_old_coze_messages()
RETURNS void AS $$
BEGIN
  -- 删除过期会话的消息（超过 24 小时）
  DELETE FROM coze_messages
  WHERE session_id IN (
    SELECT id FROM coze_sessions
    WHERE status = 'expired'
    AND updated_at < NOW() - INTERVAL '24 hours'
  );

  -- 保留活跃会话最近 100 条消息
  DELETE FROM coze_messages cm1
  WHERE id NOT IN (
    SELECT cm2.id
    FROM coze_messages cm2
    WHERE cm2.session_id = cm1.session_id
    ORDER BY cm2.created_at DESC
    LIMIT 100
  )
  AND cm1.created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 创建索引以优化清理查询
CREATE INDEX IF NOT EXISTS idx_coze_sessions_status_updated
ON coze_sessions(status, updated_at);

-- 创建视图：会话统计
CREATE OR REPLACE VIEW coze_session_stats AS
SELECT
  status,
  COUNT(*) as session_count,
  AVG(message_count) as avg_message_count,
  MAX(last_activity) as last_activity
FROM coze_sessions
WHERE updated_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- 创建视图：活跃会话列表
CREATE OR REPLACE VIEW active_coze_sessions AS
SELECT
  cs.id,
  cs.user_id,
  cs.conversation_id,
  cs.last_activity,
  cs.message_count,
  COUNT(cm.id) as message_history_count,
  EXTRACT(EPOCH FROM (NOW() - cs.last_activity))/60 as minutes_since_last_activity
FROM coze_sessions cs
LEFT JOIN coze_messages cm ON cs.id = cm.session_id
WHERE cs.status = 'active'
GROUP BY cs.id
ORDER BY cs.last_activity DESC;

-- 添加注释
COMMENT ON TABLE coze_sessions IS 'Coze Bot 对话会话表';
COMMENT ON TABLE coze_messages IS 'Coze 对话消息历史表';
COMMENT ON TABLE coze_connection_logs IS 'Coze 连接日志表';
COMMENT ON VIEW coze_session_stats IS '会话统计视图';
COMMENT ON VIEW active_coze_sessions IS '活跃会话列表视图';
