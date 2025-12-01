-- 在 Supabase Dashboard 的 SQL Editor 中执行这些命令
-- 这将立即解决对话创建问题

-- 1. 临时禁用 RLS 策略进行测试
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 2. 验证禁用状态
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'conversations', 'messages');

-- 3. 测试数据插入（可选）
-- 这会验证权限是否正确
-- INSERT INTO public.conversations (user_id, title, status) 
-- VALUES ('test-user-id', '测试对话', 'active');