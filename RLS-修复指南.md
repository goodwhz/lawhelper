# RLS 策略修复指南

## 问题描述
在 ai-chat 页面无法创建对话，很可能是由于 Row Level Security (RLS) 策略配置问题导致权限不足。

## 解决方案

### 方案 1：手动修复 RLS 策略（推荐）

1. **访问 Supabase Dashboard**
   - 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 登录并选择你的项目 (duyfvvbgadrwaonvlrun)

2. **打开 SQL Editor**
   - 在左侧菜单中选择 "SQL Editor"
   - 点击 "New query"

3. **执行以下 SQL 命令**

```sql
-- 临时禁用 RLS 进行快速测试
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
```

4. **测试应用**
   - 访问 `http://localhost:3005/ai-chat`
   - 现在应该能够成功创建对话

5. **如果测试成功，重新启用 RLS 并修复策略**

```sql
-- 重新启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
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

-- 创建修复后的策略
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = user_id);
```

### 方案 2：使用测试页面

1. **访问调试页面**: `http://localhost:3005/ai-chat-debug`
   - 查看侧边栏底部的调试信息
   - 确认用户登录状态和错误详情

2. **访问简化页面**: `http://localhost:3005/ai-chat-simple`
   - 基于 test-chat-supabase.html 的逻辑
   - 应该能正常工作

### 方案 3：添加 SERVICE_ROLE_KEY

如果你想通过代码自动修复 RLS 策略：

1. **获取 SERVICE_ROLE_KEY**
   - 在 Supabase Dashboard 中
   - Settings → API → service_role (secret)
   - 添加到环境变量: `SUPABASE_SERVICE_ROLE_KEY`

2. **更新 .env 文件**
```
# 添加这行到 .env 文件
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. **调用修复 API**
```bash
curl -X POST http://localhost:3005/api/disable-rls
```

## 验证修复

修复完成后，执行以下验证：

1. **登录应用** - 确保用户已登录
2. **访问聊天页面** - `http://localhost:3005/ai-chat`
3. **点击"新建对话"** - 应该成功创建
4. **发送消息** - 应该正常保存

## 常见错误

### "permission denied for table conversations"
- RLS 策略阻止访问
- 执行方案 1 中的 SQL 命令

### "No rows returned"
- 表存在但没有数据
- 这是正常的，第一个对话应该能正常创建

### "auth.uid() is null"
- 用户未认证
- 确保用户已登录

## 监控和调试

使用以下工具监控问题：

1. **浏览器开发者工具**
   - 查看 Console 标签的错误信息
   - Network 标签查看 API 调用

2. **Supabase Dashboard**
   - Logs → Database logs 查看数据库错误
   - Authentication 查看用户会话

3. **调试页面**
   - 访问 `http://localhost:3005/ai-chat-debug`
   - 查看详细的调试信息

## 联系支持

如果问题仍然存在：
1. 提供浏览器控制台的完整错误信息
2. 提供调试页面的调试日志
3. 确认已执行的 SQL 命令和结果