-- 完全禁用所有表的行级安全策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行以下命令

-- 1. 禁用所有主要表的 RLS 策略
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.law_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.law_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.administrative_laws DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.local_regulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.national_laws DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有的 RLS 策略（确保完全清理）
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable update for all users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.law_documents;

-- 3. 授予公共访问权限（确保所有用户都可以读取数据）
-- 注意：这将允许任何匿名用户访问这些表，仅用于开发测试
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 4. 验证表的状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 5. 验证策略状态
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 执行完成后，您应该能够：
-- 1. 在网页中正常读取数据库内容
-- 2. 创建新的对话和消息
-- 3. 访问所有法律文档数据
-- 4. 不再受到权限限制

-- 注意：这是完全禁用安全性的临时解决方案
-- 在生产环境中，您应该重新启用 RLS 并配置适当的策略