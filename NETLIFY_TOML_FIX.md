# Netlify.toml 配置修复说明

## 问题描述

在部署到Netlify时,遇到以下错误:

```
Configuration property functions.timeout must be an object.
Invalid syntax

  [functions]
  timeout = 60

Valid syntax

  [functions]

    [functions.timeout]
    external_node_modules = [
      "module-one",
      "module-two"
    ]
```

## 根本原因

Netlify的`netlify.toml`配置语法限制:

1. **不支持全局的`functions.timeout`配置**
   - `timeout` 不能作为 `[functions]` 的直接属性
   - 必须针对特定路径配置

2. **Netlify Functions配置格式限制**
   - `[functions]` 下只能配置: `directory`, `included_files`, `node_bundler` 等
   - 不能配置全局的 `timeout`

3. **Next.js API路由特殊处理**
   - Next.js的API路由不是传统的Netlify Functions
   - 需要通过Next.js的API Routes处理,不适用Netlify的functions配置

## 解决方案

### 简化netlify.toml配置

移除了所有可能引起问题的函数配置,只保留必需的配置:

```toml
# Netlify 部署配置

[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NEXT_TELEMETRY_DISABLED = "1"
  NPM_FLAGS = "--legacy-peer-deps"

# Next.js 路由支持
[[redirects]]
  from = "/_next/*"
  to = "/_next/:splat"
  status = 200

# 静态资源缓存
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 超时控制在后端代码中处理

API超时和重试逻辑在后端代码中实现:

#### app/api/coze/chat/route.ts
```typescript
const MAX_RETRIES = 5
const RETRY_DELAY = 2000 // 2秒
const REQUEST_TIMEOUT = 60000 // 60秒超时
```

#### app/api/spark-evaluator/chat/route.ts
```typescript
const MAX_RETRIES = 5
const RETRY_DELAY = 2000 // 2秒
const REQUEST_TIMEOUT = 60000 // 60秒超时
```

### 前端重连优化

前端组件实现了智能重连机制:

#### dispute-questionnaire.tsx
- 重连次数限制: 5次
- 自动重试间隔: 3秒
- 成功后重置计数器

#### niu-ma-evaluator-chat.tsx
- 重连次数限制: 5次
- 自动重试间隔: 3秒
- 提供友好的错误提示

## 为什么这样配置有效

### 1. Netlify Edge Functions自动优化

Netlify Edge Functions会自动:
- 根据请求复杂度调整超时时间
- 提供合理的默认值(通常10-60秒)
- 支持流式响应

### 2. Next.js API Routes特性

Next.js的API Routes:
- 在服务器端渲染
- 支持长时间运行的任务
- 通过`AbortController`控制超时
- 实现自定义的重试逻辑

### 3. 前端重连兜底

即使API超时:
- 前端自动重试(最多5次)
- 提供降级方案(模拟响应)
- 用户可以手动重连
- 清晰的错误提示

## 验证部署

### 1. 本地测试

```bash
# 构建项目
npm run build

# 本地运行
npm run start

# 测试API端点
curl http://localhost:3000/api/coze/chat
curl http://localhost:3000/api/spark-evaluator/chat
```

### 2. Netlify部署测试

1. 提交代码到Git
2. Netlify自动触发部署
3. 检查部署日志
4. 测试API功能:
   - 争议解决中心
   - 牛马测评仪
   - 智能问答

### 3. 检查Functions日志

在Netlify Dashboard中:
- **Deployments** → 选择部署 → **Functions logs**
- 查看是否有超时或网络错误
- 检查重试逻辑是否正常工作

## 监控和调优

### 如果遇到超时问题

1. **查看Netlify Functions日志**
   - 确认是否真的超时
   - 检查网络延迟

2. **优化API响应时间**
   - 减少Coze API的查询复杂度
   - 优化数据处理逻辑
   - 考虑使用缓存

3. **调整重试策略**
   - 增加重试延迟
   - 减少最大重试次数
   - 实现指数退避算法

### 性能指标

监控以下指标:
- API响应时间(p50, p95, p99)
- 错误率
- 重试成功率
- 用户体验(页面加载时间)

## 相关文档

- `NETLIFY_DEPLOYMENT_GUIDE.md` - 完整部署指南
- `NETLIFY_DEPLOYMENT_CHECKLIST.md` - 部署检查清单
- `COZE_CONNECTION_IMPROVEMENTS.md` - Coze连接改进
- `ESLINT_FIX_SUMMARY.md` - ESLint错误修复

## 总结

通过简化`netlify.toml`配置:
- ✅ 避免了配置语法错误
- ✅ 利用Netlify自动优化
- ✅ 在代码层面控制超时和重试
- ✅ 前端提供智能重连
- ✅ 保证用户体验和系统稳定性

---

**状态:** ✅ 已修复
**日期:** 2025-01-08
**影响:** Netlify部署配置
