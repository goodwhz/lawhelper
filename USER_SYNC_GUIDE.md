# 用户数据同步指南

## 概述

本指南说明了如何保持 `auth.users` 表和 `public.user_profiles` 表数据的一致性。

## 问题描述

- `auth.users` 表：存储用户认证信息（8个用户）
- `public.user_profiles` 表：存储用户详细信息（原来只有2个用户）
- 两个表通过 `user_profiles.id` 字段关联到 `users.id`

## 解决方案

### 1. 数据同步 ✅ 已完成

已通过SQL脚本将所有缺失的用户档案同步到 `public.user_profiles` 表：

```sql
INSERT INTO public.user_profiles (
  id, email, name, role, created_at, updated_at, last_login_at
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
```

### 2. 自动化触发器 ✅ 已创建

创建了数据库触发器，确保：

- **新用户注册**：当 `auth.users` 插入新用户时，自动在 `user_profiles` 创建记录
- **用户信息更新**：当 `auth.users` 更新时，同步更新 `user_profiles` 中的对应信息

#### 触发器函数

1. `create_user_profile()` - 新用户自动创建档案
2. `update_user_profile()` - 用户信息更新时同步档案

## 当前状态

- ✅ 所有8个用户都已同步到 `user_profiles` 表
- ✅ 1个管理员用户，7个普通用户
- ✅ 自动化触发器已启用
- ✅ 数据完全一致

## 文件说明

### 脚本文件

- `scripts/sync-user-profiles.ts` - TypeScript版本的同步脚本
- `scripts/run-sync.js` - 运行同步脚本的包装器
- `scripts/sync-user-profiles.sql` - SQL版本的同步脚本

### 数据库迁移

- `auto_create_user_profile_trigger` - 自动化触发器迁移

## 验证数据

可以使用以下SQL查询验证数据一致性：

```sql
-- 检查所有用户是否已同步
SELECT 
  au.id,
  au.email,
  up.name,
  up.role,
  CASE 
    WHEN up.id IS NOT NULL THEN '✅ 已同步' 
    ELSE '❌ 未同步' 
  END as sync_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- 统计用户数量
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM public.user_profiles;
```

## 维护说明

### 手动同步

如果未来需要手动同步，可以：

1. **方式一：直接运行SQL**
   ```bash
   psql -d your_database -f scripts/sync-user-profiles.sql
   ```

2. **方式二：运行TypeScript脚本**
   ```bash
   cd lawhelper
   npm run sync:users
   ```

### 监控建议

建议定期检查数据一致性：

```sql
-- 检查是否有用户未同步
SELECT COUNT(*) as unsynced_users
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

## 注意事项

1. **权限**：操作auth表需要服务角色密钥（service role key）
2. **备份**：在执行任何批量操作前建议备份数据
3. **测试**：在生产环境执行前先在测试环境验证
4. **触发器**：数据库触发器会自动处理未来的数据同步

## 更新历史

- **2025-12-02**: 初始数据同步完成，创建自动化触发器
- 当前版本: v1.0