# 管理员权限设置指南

## 问题解决状态

✅ **已修复的问题**：
1. Supabase 环境变量配置 - 已配置
2. RLS（行级安全）策略 - 已启用管理员权限策略
3. 用户管理API路由 - 已修复checkIsAdmin函数调用
4. 权限检查逻辑 - 已改善错误处理

## 管理员账号

已存在的管理员账号：
- **邮箱**: `admin@lawhelper.com`
- **角色**: `admin`
- **用户ID**: `4fa3a590-0fe1-41bd-a3ba-ab781ed896b9`

## 测试步骤

### 1. 登录管理员账号
1. 访问 http://localhost:3000
2. 使用邮箱 `admin@lawhelper.com` 登录
3. 如果需要密码，请重置密码或联系开发者

### 2. 访问管理员后台
1. 登录成功后，访问管理员页面
2. 确认能看到用户列表管理功能

### 3. 测试用户管理功能
1. 查看用户列表
2. 搜索用户
3. 编辑用户信息
4. 测试批量操作

## API测试

可以通过以下方式测试API：

```javascript
// 在浏览器控制台中运行
async function testAdminAPI() {
  const { supabase } = await import('/lib/supabaseClient.js')
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('请先登录')
    return
  }
  
  const response = await fetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  
  console.log('API响应:', response.status)
  const data = await response.json()
  console.log('用户数据:', data)
}

testAdminAPI()
```

## 权限策略说明

### 启用的RLS策略
- ✅ user_profiles: 管理员可查看/更新/删除所有用户
- ✅ conversations: 管理员可查看所有对话
- ✅ messages: 管理员可查看所有消息

### 普通用户策略
- ✅ 用户只能访问自己的资料和对话
- ✅ 管理员可以访问所有数据

## 故障排除

### 如果仍然无法获取用户信息

1. **检查登录状态**
   - 确保用户已正确登录
   - 检查浏览器控制台是否有认证错误

2. **检查用户角色**
   - 确认登录用户的role为'admin'
   - 可以通过调试API检查: `/api/debug/auth`

3. **检查RLS策略**
   - 确认RLS已启用
   - 确认管理员策略已正确应用

4. **检查网络连接**
   - 确保能访问Supabase服务
   - 检查CORS设置

## 数据库表状态

当前数据库包含以下表：
- `user_profiles` (7个用户，1个管理员)
- `conversations` (5个对话)
- `messages` (76条消息)
- `law_categories` (5个分类)
- `law_documents` (79个文档)

## 开发调试

使用以下调试端点：
- `/api/debug/auth` - 检查认证状态
- 浏览器开发者工具 - 查看网络请求和错误

## 安全注意事项

1. ⚠️ 生产环境中应更改默认管理员密码
2. ⚠️ 确保管理员权限只分配给可信用户
3. ⚠️ 定期检查用户权限和角色分配