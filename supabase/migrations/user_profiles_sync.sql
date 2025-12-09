-- ============================================
-- 用户档案表与Auth用户完全同步解决方案
-- ============================================

-- 确保user_profiles表存在且结构正确
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- 启用行级安全
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建触发器函数：新用户注册时自动创建档案
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        name,
        role,
        created_at,
        updated_at,
        last_login_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1)
        ),
        CASE 
            WHEN NEW.email LIKE '%admin%' OR NEW.email LIKE '%administrator%' THEN 'admin'
            ELSE 'user'
        END,
        NEW.created_at,
        NEW.updated_at,
        NEW.last_sign_in_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP,
        last_login_at = EXCLUDED.last_login_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 创建触发器函数：用户信息更新时同步档案
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        email = NEW.email,
        name = COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1)
        ),
        updated_at = CURRENT_TIMESTAMP,
        last_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 创建触发器函数：用户登录时更新最后登录时间
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        last_login_at = NEW.last_sign_in_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 创建触发器
-- ============================================

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- 新用户注册触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 用户信息更新触发器
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_user_update();

-- 用户登录触发器
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.handle_user_login();

-- ============================================
-- 创建实时同步检查函数
-- ============================================

CREATE OR REPLACE FUNCTION public.check_user_profiles_sync()
RETURNS TABLE(
    user_id UUID,
    auth_email VARCHAR,
    profile_email VARCHAR,
    sync_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email as auth_email,
        up.email as profile_email,
        CASE 
            WHEN up.id IS NULL THEN '❌ 未同步 - 缺失档案'
            WHEN au.email != up.email THEN '⚠️ 不同步 - 邮箱不一致'
            WHEN up.updated_at < au.updated_at THEN '⚠️ 不同步 - 档案过期'
            ELSE '✅ 已同步'
        END as sync_status
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 创建强制同步函数
-- ============================================

CREATE OR REPLACE FUNCTION public.force_sync_user_profiles()
RETURNS TABLE(
    user_id UUID,
    email VARCHAR,
    sync_result TEXT
) AS $$
BEGIN
    -- 同步所有auth.users到user_profiles
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
    WHERE up.id IS NULL
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP,
        last_login_at = EXCLUDED.last_login_at;
    
    -- 返回同步结果
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        CASE 
            WHEN up.id IS NULL THEN '✅ 已同步'
            ELSE '✅ 已更新'
        END as sync_result
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 创建RLS策略
-- ============================================

-- 管理员可以管理所有用户档案
CREATE POLICY "管理员可以管理所有用户档案" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- 用户可以查看自己的档案
CREATE POLICY "用户可以查看自己的档案" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

-- 用户可以更新自己的档案（除了角色）
CREATE POLICY "用户可以更新自己的档案" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role IS NOT DISTINCT FROM OLD.role);

-- ============================================
-- 创建同步监控视图（无过期机制）
-- ============================================

CREATE OR REPLACE VIEW public.user_sync_status AS
SELECT 
    au.id,
    au.email,
    up.name,
    up.role,
    au.created_at as auth_created,
    up.created_at as profile_created,
    au.updated_at as auth_updated,
    up.updated_at as profile_updated,
    au.last_sign_in_at as last_sign_in,
    up.last_login_at as last_login,
    CASE 
        WHEN up.id IS NULL THEN 'missing'
        WHEN au.email != up.email THEN 'email_mismatch'
        ELSE 'synced'
    END as sync_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- ============================================
-- 创建同步统计视图（无过期机制）
-- ============================================

CREATE OR REPLACE VIEW public.user_sync_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced_users,
    COUNT(CASE WHEN sync_status = 'missing' THEN 1 END) as missing_users,
    COUNT(CASE WHEN sync_status = 'email_mismatch' THEN 1 END) as email_mismatch_users,
    ROUND(
        COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as sync_percentage
FROM public.user_sync_status;

-- ============================================
-- 创建API辅助函数
-- ============================================

-- 获取用户同步状态
CREATE OR REPLACE FUNCTION public.get_user_sync_status(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF user_id IS NOT NULL THEN
        SELECT json_build_object(
            'user_id', uss.id,
            'email', uss.email,
            'sync_status', uss.sync_status,
            'details', json_build_object(
                'auth_created', uss.auth_created,
                'profile_created', uss.profile_created,
                'auth_updated', uss.auth_updated,
                'profile_updated', uss.profile_updated,
                'last_sign_in', uss.last_sign_in,
                'last_login', uss.last_login
            )
        )
        INTO result
        FROM public.user_sync_status uss
        WHERE uss.id = user_id;
    ELSE
        SELECT json_build_object(
            'stats', (SELECT row_to_json(uss) FROM public.user_sync_stats uss),
            'users', (SELECT json_agg(row_to_json(uss)) FROM public.user_sync_status uss)
        )
        INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 输出同步状态（用于验证）
-- ============================================

DO $$ 
DECLARE
    sync_count INTEGER;
    total_count INTEGER;
BEGIN
    -- 检查同步状态
    SELECT COUNT(*) INTO total_count FROM auth.users;
    SELECT COUNT(*) INTO sync_count FROM public.user_profiles;
    
    RAISE NOTICE '同步状态检查: % 个认证用户，% 个用户档案', total_count, sync_count;
    
    IF total_count = sync_count THEN
        RAISE NOTICE '✅ 用户数据完全同步！';
    ELSE
        RAISE NOTICE '⚠️ 有 % 个用户需要同步', (total_count - sync_count);
    END IF;
END $$;