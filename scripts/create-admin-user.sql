-- 创建管理员账户的 SQL 脚本
-- 注意：此脚本需要在 Supabase 的 SQL 编辑器中手动运行

-- 1. 插入管理员账户到 auth.users 表
-- 注意：在 Supabase 中，你不能直接插入到 auth.users 表
-- 你需要使用以下两种方法之一：

-- 方法 1：通过注册 UI 创建账户，然后运行以下 SQL 更新其角色为管理员
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@lawhelper.com';

-- 方法 2：使用 Supabase 的 CLI 或 API 创建管理员账户

-- 2. 确保管理员账户的权限
-- 我们已经创建了 RLS 策略，允许管理员查看和更新所有用户资料

-- 3. 检查用户资料
SELECT * FROM public.user_profiles WHERE email = 'admin@lawhelper.com';

-- 4. 列出所有用户
SELECT * FROM public.user_profiles ORDER BY created_at DESC;