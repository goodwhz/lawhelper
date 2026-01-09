# Netlify 部署完整指南

## 问题诊断

在 Netlify 上部署后,争议解决中心和牛马测评仪经常连接失败的原因:

### 1. **Netlify 函数配置问题**
- Netlify 的函数配置与 Vercel 不同
- 缺少 API 路由重定向规则
- 超时设置不兼容

### 2. **环境变量未正确配置**
- Netlify Dashboard 需要单独配置环境变量
- `.env.local` 文件在部署时不会被自动读取
- 生产环境变量缺失导致 API 调用失败

### 3. **网络超时问题**
- Netlify 函数默认超时时间较短
- Coze API 响应时间较长,容易超时
- 重试机制不够健壮

### 4. **重连逻辑缺陷**
- 重连次数限制过低(3次)
- 重试延迟固定,不适合网络波动场景
- 缺少指数退避策略

---

## 完整解决方案

### 步骤 1: 更新 netlify.toml 配置

已在 `netlify.toml` 中添加以下配置:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NEXT_TELEMETRY_DISABLED = "1"
  NPM_FLAGS = "--legacy-peer-deps"

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

**说明:**
- 简化了配置,移除了可能引起语法错误的函数配置
- Netlify Edge Functions会自动使用合理的超时时间
- API超时在后端代码中通过 `fetchWithRetry` 函数控制

### 步骤 2: 优化 API 路由

已在以下文件中优化重试机制:
- `app/api/coze/chat/route.ts`
- `app/api/spark-evaluator/chat/route.ts`

**改进内容:**
- 重试次数从 3 次增加到 5 次
- 重试延迟从 1 秒增加到 2 秒
- 实现递增延迟策略(2s, 4s, 6s, 8s, 10s)
- 增强错误检测(包含更多网络错误类型)
- 超时时间增加到 60 秒

### 步骤 3: 优化前端重连逻辑

已在 `app/components/tools/niu-ma-evaluator-chat.tsx` 中优化重连:
- 重连次数限制从 3 次增加到 5 次
- 添加自动重试机制(失败后 3 秒自动重试)
- 改进连接状态管理
- 提供更友好的错误提示

---

## Netlify 环境变量配置

### 在 Netlify Dashboard 中配置环境变量

1. 登录 [Netlify Dashboard](https://app.netlify.com/)
2. 选择你的项目
3. 进入 **Site settings** → **Environment variables**
4. 添加以下环境变量:

#### 必需的环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://duyfvvbgadrwaonvlrun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MzYyMCwiZXhwIjoyMDc1ODU5NjIwfQ.Ens_KrmOz0j_V3mq637j2-AjD1Mh4oHr4NblJTiJMT8

# Dify AI 配置
NEXT_PUBLIC_APP_ID=5e18f32a-f037-4eb6-92fc-4fd1bb1b0923
NEXT_PUBLIC_APP_KEY=app-eNk3GtruKTh2pHmcBk7g6gs4
NEXT_PUBLIC_API_URL=https://dify.aipfuture.com/v1
DIFY_API_URL=https://dify.aipfuture.com/v1
DIFY_APP_KEY=app-eNk3GtruKTh2pHmcBk7g6gs4
DIFY_APP_ID=5e18f32a-f037-4eb6-92fc-4fd1bb1b0923

# Coze API 配置 - 争议解决中心
COZE_API_URL=https://x6yjs8hc3k.coze.site/stream_run
COZE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NWIzNDljLTE5ZWItNGVhMC1iY2YzLTYwODFmY2Q4OTIyZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkREdzJSeVRvemxCY25KZTFGc25pY0RXOExNVndZNE1MIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NDk0MDkyLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5MTU5MzczNTM3MDE3ODk3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxMzI5MzI0Mzk4MDE4NjAzIn0.NCJPVXl_1I7ajX2QruY1wvZO9TAHVJ4qHJxF82VjzZyyewP2MJDN2afzPZmTH7tyZgJrA5cEz6S8jeYqUrFDUUe3lcE6ImQDi9KdwoWeR5IvOpYyEODwjKmyBCKTL38d2nsArApFXgBRz2PIRmJKhtSS6Re8nR0N_p0nFTqt8v1IabwMYdaJ8Wq8BsAdv1FwJF0Ru_ruh7aseeoo0HymdKH2iPWlYRfnNteJHkAK_XVGoUrR2b__d2syoQ6SuiXVjokpLHbWJ4SWtTEb7K0sxdT39Pr2xevKActb7vw77SvD7cII_fBpLHbhQl1mtoAnyDnHWXP2kwF61n9rnaGunA
COZE_PROJECT_ID=7589159373537017897

# Coze API 配置 - 牛马测评仪
NIUMA_COZE_API_URL=https://qz6hgwr9c2.coze.site/stream_run
NIUMA_COZE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NWIzNDljLTE5ZWItNGVhMC1iY2YzLTYwODFmY2Q4OTIyZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkVZdE5SRm9vRkl0bXR2SjBOT0hlbGQxdXRjSFJOeFBWIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NTI3MDM5LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5OTM0NDk0ODIwMzM1NjM1Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxNDcwODI4MjEwODgwNTY0In0.qUTzs6B5HTXvugr1Zbz2ekHhshnc0ryv_gPWxuKfK3zdVcr-wHkjbSBlz50WVg8j7fXjZ3xYbIIa91BFtJZPgQJDXaeGHK73jlpIHbCR7YdIczVflEwRn0qkJRuXFxFZ7MY6oMQMalxz08w8AK2btfgUvBto-Y1iRzcsl0nlpI0y3biZDrAXLyXPSy2MN9LWIInWO-yhg45r5tD758bvhfSSDjh6v0FyhgILSUB-kH8l7WP3TzP6ihyhVjPEsezy9VYnX183lsbnQDqWSDlABsyTC41G9cyNcpbB8MC4zRMEOXtaiHYzuQIZbrKOZF7laIRa-IefdV5kfCuoynVBZg
NIUMA_COZE_PROJECT_ID=7589925531894808617

# 其他配置
NEXT_TELEMETRY_DISABLED=1
```

### 步骤 4: 部署到 Netlify

#### 方法 1: 通过 Git 仓库部署

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 Netlify 中连接仓库
3. 配置构建命令和发布目录:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 点击 **Deploy site**

#### 方法 2: 通过 Netlify CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 初始化项目
netlify init

# 部署
netlify deploy --prod
```

#### 方法 3: 通过拖放部署

1. 运行 `npm run build` 构建项目
2. 将 `.next` 文件夹拖放到 Netlify Dashboard

---

## 部署后验证

### 1. 检查环境变量

在 Netlify Dashboard 中确认所有环境变量都已正确配置:
- **Site settings** → **Environment variables**
- 确认所有 API Token 和 URL 都已添加

### 2. 检查函数日志

- **Deployments** → 选择部署版本 → **Functions logs**
- 查看是否有错误信息
- 检查超时和网络错误

### 3. 测试 API 端点

在浏览器中直接访问:
- `https://your-site.netlify.app/api/dify/chat-stream`
- `https://your-site.netlify.app/api/coze/chat`
- `https://your-site.netlify.app/api/spark-evaluator/chat`

### 4. 测试前端功能

- 争议解决中心: 测试问卷提交和 AI 分析
- 牛马测评仪: 测试对话交互和重连功能
- 智能问答: 测试 Dify API 对话

---

## 故障排除

### 问题 1: 函数超时

**症状:** API 调用经常超时失败

**解决方案:**
```toml
# 在 netlify.toml 中增加超时时间
[functions."/api/coze/*"]
  timeout = 120  # 增加到 120 秒
```

### 问题 2: 环境变量未生效

**症状:** API 返回 "Token 未配置" 错误

**解决方案:**
1. 确认环境变量已在 Netlify Dashboard 中添加
2. 重新部署项目
3. 检查变量名称是否与代码中一致

### 问题 3: API 路由 404

**症状:** API 请求返回 404 Not Found

**解决方案:**
1. 确认 `netlify.toml` 中的重定向规则已添加
2. 重新部署项目
3. 检查 API 路径是否正确

### 问题 4: 重连失败

**症状:** 点击重连按钮后仍然失败

**解决方案:**
1. 检查 Netlify Functions 日志
2. 确认 API Token 是否有效
3. 检查网络连接和 Coze API 状态
4. 刷新页面重新初始化

### 问题 5: 构建失败

**症状:** Netlify 构建过程中报错

**解决方案:**
```bash
# 检查本地构建
npm run build

# 查看构建日志
netlify logs

# 清理缓存
netlify deploy --prod --force
```

---

## 性能优化建议

### 1. 启用函数缓存

```toml
[functions]
  timeout = 60
  node_bundler = "esbuild"
  included_files = ["**/*.json"]  # 缓存配置文件
```

### 2. 使用 CDN 加速

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=300"  # 5 分钟缓存
```

### 3. 监控函数性能

在 Netlify Dashboard 中:
- **Functions** → **Monitoring**
- 查看函数执行时间和内存使用
- 优化慢速函数

---

## 监控和日志

### 启用详细日志

```typescript
// 在 API 路由中添加日志
console.log('=== API 请求开始 ===', {
  timestamp: new Date().toISOString(),
  url: request.url,
  method: request.method,
})
```

### 查看 Netlify 日志

```bash
# 实时查看日志
netlify logs --tail

# 查看函数日志
netlify functions:log

# 部署日志
netlify logs --deploy
```

---

## 备选方案: 使用 Netlify Edge Functions

如果 Netlify Functions 仍然不稳定,可以考虑使用 Edge Functions:

```typescript
// app/api/coze/chat/route.ts
export const config = {
  runtime: 'edge',  // 使用 Edge Runtime
}
```

Edge Functions 优势:
- 更低的延迟
- 更好的全球分布
- 更长的超时时间

---

## 总结

通过以上配置,你的 Netlify 部署将具备:

✅ **稳定的 API 连接** - 通过重试机制和超时优化
✅ **自动重连** - 智能重连机制,最大 5 次尝试
✅ **友好的错误处理** - 清晰的错误提示和降级方案
✅ **生产级性能** - 优化的超时和缓存策略
✅ **完整的监控** - 日志和性能监控

如果仍然遇到问题,请检查:
1. Netlify Dashboard 环境变量配置
2. Functions 日志中的错误信息
3. Coze API 服务状态
4. 网络连接和防火墙设置
