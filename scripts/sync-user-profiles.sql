-- 同步 auth.users 表数据到 public.user_profiles 表
-- 确保每个在 auth.users 中的用户在 public.user_profiles 中都有对应记录

-- 插入缺失的用户档案记录
INSERT INTO public.user_profiles (
  id,
  email,
  name,
  role,
  created_at,
  updated_at,
  last_login_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as name,
  CASE 
    WHEN au.email LIKE '%admin%' OR au.email LIKE '%administrator%' THEN 'admin'
    ELSE 'user'
  END as role,
  au.created_at,
  au.updated_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- 显示同步结果
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM public.user_profiles;

-- 显示所有用户档案
SELECT 
  up.id,
  up.email,
  up.name,
  up.role,
  up.created_at,
  up.updated_at,
  up.last_login_at,
  CASE WHEN up.id IS NOT NULL THEN '✅ 已同步' ELSE '❌ 未同步' END as sync_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;