# 登录问题排查指南

## 问题描述
保存测评记录时提示"请先登录",但用户已经登录了。

## 可能原因和解决方案

### 1. Session 未正确初始化

**原因**: Supabase 客户端的 session 在组件加载时可能还未完全初始化。

**解决方案**:
- 打开浏览器控制台 (F12)
- 查看是否有日志输出 "=== 开始获取用户token ==="
- 查看是否有 "getUser result" 和 "getSession result" 的日志
- 如果 `hasAccessToken` 为 false,说明 session 未正确获取

### 2. Token 获取时机问题

**原因**: `getUser()` 和 `getSession()` 可能在用户登录状态还未完全同步时就被调用。

**解决方案**:
代码已优化,现在会:
1. 先调用 `getUser()` 确认用户已登录
2. 再调用 `getSession()` 获取 access_token
3. 两个步骤都添加了详细的日志

### 3. 调试步骤

#### 步骤 1: 检查浏览器控制台日志

打开浏览器开发者工具 (F12), 切换到 Console 标签页,然后:

1. 刷新页面
2. 查找以下日志:

```
=== 开始获取用户token ===
getUser result: { user: {...}, userError: null }
getSession result: { hasSession: true, hasAccessToken: true, sessionError: null }
设置userToken成功
```

如果看到这些日志且 `hasAccessToken: true`,说明token获取成功。

#### 步骤 2: 尝试保存测评

1. 完成一次测评对话
2. 当弹出保存对话框时,点击"保存"
3. 查看控制台日志:

```
=== 开始保存测评记录 ===
Title: 测评 2026/01/25
Evaluation data: { total_score: 85, ... }
User check result: { user: {...}, userError: null }
Session check result: { hasSession: true, hasAccessToken: true, sessionError: null }
准备发送的数据: { title: ..., total_score: ... }
API响应: { status: 200, ok: true, result: {...} }
```

#### 步骤 3: 检查错误信息

如果仍然提示"请先登录",查看控制台中的:

```
用户未登录
```
或

```
Session或access_token缺失
```

### 4. 常见问题

#### Q1: 为什么 `hasAccessToken` 总是 false?

**可能原因**:
1. Supabase session 存储问题
2. Token 已过期
3. 浏览器清除了 localStorage

**解决方法**:
1. 退出登录,重新登录
2. 检查浏览器 localStorage 中是否有 `supabase.auth.token`
3. 清除浏览器缓存后重试

#### Q2: 控制台没有任何日志?

**解决方法**:
1. 确认页面已刷新 (F5)
2. 检查是否有其他错误阻止了代码执行
3. 尝试在无痕模式下打开

#### Q3: API 返回 401 错误?

**原因**: Token 无效或已过期

**解决方法**:
1. 退出登录
2. 重新登录
3. 再次尝试保存

### 5. 手动测试 Token

在浏览器控制台中执行:

```javascript
// 检查 Supabase 客户端
const { supabase } = await import('/@/lib/supabaseClient')

// 获取用户
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// 获取session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Access Token:', session?.access_token)
```

### 6. 检查 API 响应

如果控制台显示 API 请求失败,可以查看 `/api/evaluations/route.ts` 的日志:

- 检查 "接收到的请求体" 日志
- 检查 "验证Token" 相关的日志
- 检查 "验证成功" 或 "验证失败" 的日志

### 7. 数据库检查

直接查询数据库中的记录:

```sql
-- 查看当前登录用户的记录
SELECT * FROM evaluation_history
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 检查RLS策略
SELECT * FROM pg_policies
WHERE tablename = 'evaluation_history';
```

### 8. 网络请求检查

1. 打开 Network 标签页
2. 筛选 "evaluations"
3. 点击请求,查看:
   - Request Headers: 确认 `Authorization: Bearer ...` 存在
   - Response: 查看返回的错误信息

## 已实现的改进

为了解决这个问题,代码已做以下改进:

1. **双重验证**: 先确认 user 存在,再获取 session
2. **详细日志**: 添加了完整的调试日志链
3. **错误区分**: 区分"未登录"和"session过期"两种情况
4. **Token 存储优化**: 持续监听 session 状态变化

## 如果问题仍然存在

请提供以下信息以便进一步排查:

1. 浏览器控制台的完整日志 (从页面刷新开始)
2. Network 标签页中 `/api/evaluations` 请求的详细信息
3. 是否在无痕模式下复现问题
4. 当前使用的浏览器版本
5. 是否有其他 Supabase 相关的错误

## 临时解决方案

如果问题持续存在,可以暂时使用以下方法:

1. 直接在浏览器控制台手动获取 token
2. 使用 Postman 或 curl 直接调用 API
3. 临时禁用 RLS 策略进行测试 (仅开发环境)

```sql
-- 仅开发环境使用!
ALTER TABLE evaluation_history DISABLE ROW LEVEL SECURITY;
```

---

**注意**: 禁用 RLS 仅用于调试,生产环境必须启用!
