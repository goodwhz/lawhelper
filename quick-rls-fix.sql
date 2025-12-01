-- 快速修复 RLS 策略 - 完全禁用限制
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 禁用主要表的 RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_categories DISABLE ROW LEVEL SECURITY;

-- 授予匿名用户完全权限（临时解决方案）
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.conversations TO anon;
GRANT ALL ON public.messages TO anon;
GRANT ALL ON public.law_documents TO anon;
GRANT ALL ON public.law_categories TO anon;

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.law_documents TO authenticated;
GRANT ALL ON public.law_categories TO authenticated;

-- 删除所有 RLS 策略
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

DROP POLICY IF EXISTS "Enable read access for all users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable update for all users" ON public.law_documents;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.law_documents;

-- 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'conversations', 'messages', 'law_documents', 'law_categories')
ORDER BY tablename;