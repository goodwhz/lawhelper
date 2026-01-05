# API 连接优化与部署指南

## 已完成的优化

### 1. 增强的 API 连接稳定性

#### 争议解决中心 API (`/api/coze/chat`)
- ✅ 添加重试机制（最多 3 次重试）
- ✅ 超时控制（45 秒，适应 Vercel 60 秒限制）
- ✅ 环境变量兼容（支持 `COZE_*` 和 `NIUMA_COZE_*`）
- ✅ 降级方案（API 失败时返回模拟响应）
- ✅ 增强的日志记录

#### 牛马测评仪 API (`/api/spark-evaluator/chat`)
- ✅ 添加重试机制（最多 3 次重试）
- ✅ 超时控制（45 秒）
- ✅ 环境变量兼容（支持 `NIUMA_COZE_*` 和 `COZE_*`）
- ✅ 降级方案（API 失败时返回模拟响应）
- ✅ 增强的日志记录

### 2. 环境变量优化

统一了环境变量配置，两个 API 现在都支持：

```bash
# 主要配置
COZE_API_URL=https://x6yjs8hc3k.coze.site/stream_run
COZE_API_TOKEN=<你的Token>
COZE_PROJECT_ID=7589147310182039571

# 牛马测评仪可选配置（如果不配置，自动使用上面的）
NIUMA_COZE_API_URL=https://qz6hgwr9c2.coze.site/stream_run
NIUMA_COZE_API_TOKEN=<牛马测评仪专用Token>
NIUMA_COZE_PROJECT_ID=7589925531894808617
```

### 3. 部署配置文件

#### Vercel 部署 (`vercel.json`)
- ✅ API 路由最大执行时间：60 秒
- ✅ 香港区域部署（`hkg1`）- 更快的连接速度
- ✅ 静态资源缓存优化
- ✅ 安全头部配置

#### Netlify 部署 (`netlify.toml`)
- ✅ API 重写规则
- ✅ SPA 路由支持
- ✅ 静态资源缓存优化
- ✅ Node.js 18 运行时

---

## 部署到 Vercel

### 步骤 1: 准备部署

1. 确保代码已推送到 Git 仓库（GitHub/GitLab/Bitbucket）

2. 在 Vercel 项目设置中配置环境变量：

   **必需的环境变量：**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://duyfvvbgadrwaonvlrun.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   COZE_API_URL=https://x6yjs8hc3k.coze.site/stream_run
   COZE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjU4OWU3ZjlkLWQ5YzQtNDkzNi1iZGQzLTI2YWU2OGNhZDMzMiJ9...
   COZE_PROJECT_ID=7589147310182039571
   ```

   **可选的环境变量（牛马测评仪专用）：**
   ```
   NIUMA_COZE_API_URL=https://qz6hgwr9c2.coze.site/stream_run
   NIUMA_COZE_API_TOKEN=<牛马测评仪专用Token>
   NIUMA_COZE_PROJECT_ID=7589925531894808617
   ```

### 步骤 2: 部署配置

Vercel 会自动读取 `vercel.json` 文件，无需额外配置。

关键配置说明：
- `regions: ["hkg1"]` - 使用香港区域，减少 API 调用延迟
- `maxDuration: 60` - API 路由最长执行 60 秒

### 步骤 3: 增强连接的方法

#### 方法 1: 使用 Edge Functions（推荐）

将 API 路由移动到 Edge Functions，部署到更靠近用户的区域：

```typescript
// app/api/coze/chat/route.ts
export const runtime = 'edge' // 添加这一行
export async function POST(request: NextRequest) {
  // ... 现有代码
}
```

Edge Functions 的优势：
- 更低的延迟（部署在全球边缘节点）
- 更快的冷启动
- 更好的并发处理

#### 方法 2: 使用队列处理长时间任务

对于可能超过 60 秒的任务，使用队列：

1. 安装依赖：
   ```bash
   npm install @vercel/kv
   ```

2. 修改 API 使用队列处理：
   ```typescript
   import { kv } from '@vercel/kv'
   
   export async function POST(request: NextRequest) {
     const { disputeType, description } = await request.json()
     
     // 创建任务 ID
     const taskId = crypto.randomUUID()
     
     // 将任务放入队列
     await kv.lpush('tasks', { taskId, disputeType, description })
     
     // 返回任务 ID，前端轮询结果
     return NextResponse.json({ taskId })
   }
   
   // 创建单独的路由来轮询结果
   // app/api/task/[taskId]/route.ts
   export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
     const result = await kv.hgetall(`task:${params.taskId}`)
     return NextResponse.json(result)
   }
   ```

#### 方法 3: 使用 CDN 缓存

在 Vercel 中配置 CDN 缓存策略：

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/status",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 部署到 Netlify

### 步骤 1: 准备部署

1. 确保代码已推送到 Git 仓库

2. 在 Netlify 项目设置中配置环境变量（与 Vercel 相同）

### 步骤 2: 部署配置

Netlify 会自动读取 `netlify.toml` 文件。

### 步骤 3: 增强连接的方法

#### 方法 1: 使用 Netlify Functions

Next.js API 路由会被自动转换为 Netlify Functions。

#### 方法 2: 启用 Durable Functions

对于需要持久化的功能：

```toml
# netlify.toml
[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@netlify/functions"]
```

#### 方法 3: 使用 Background Functions

对于长时间运行的任务（最长 15 分钟）：

```typescript
// 将文件命名为 netlify/functions/my-bg-function.ts
export default async (req: Request, context: any) => {
  const body = await req.json()
  
  // 返回 200 立即响应
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Task started" })
  }
  
  // 后续处理在后台继续运行...
}
```

---

## 监控和调试

### 1. Vercel 监控

- 访问 Vercel Dashboard → Logs
- 查看 API 路由的执行时间和错误
- 使用 Web Vitals 监控性能

### 2. Netlify 监控

- 访问 Netlify Dashboard → Functions → Logs
- 查看函数调用日志
- 使用 Analytics 监控性能

### 3. 自定义监控

在代码中添加更详细的日志：

```typescript
console.log('=== API 调用开始 ===', {
  timestamp: new Date().toISOString(),
  endpoint: '/api/coze/chat',
  params: { disputeType }
})

// ... 处理逻辑 ...

console.log('=== API 调用完成 ===', {
  duration: endTime - startTime,
  success: true
})
```

---

## 常见问题解决

### 问题 1: API 经常超时

**解决方案：**
1. 使用 Edge Functions 减少延迟
2. 添加重试机制（已实现）
3. 使用队列处理长时间任务

### 问题 2: Coze API 限流

**解决方案：**
1. 实现请求速率限制
2. 使用多个 API Token 轮询
3. 缓存常见问题的响应

```typescript
// 速率限制实现
const rateLimit = new Map<string, number[]>()
const MAX_REQUESTS = 10 // 每分钟最多 10 次
const WINDOW_MS = 60000 // 1 分钟窗口

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const requests = rateLimit.get(ip) || []
  
  // 移除过期的请求记录
  const recentRequests = requests.filter(t => now - t < WINDOW_MS)
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false
  }
  
  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  return true
}
```

### 问题 3: 部署后 API 路由 404

**Vercel 解决方案：**
确保 `vercel.json` 中正确配置了 functions：
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**Netlify 解决方案：**
确保 `netlify.toml` 中正确配置了重写规则。

---

## 性能优化建议

1. **启用缓存**
   - 缓存静态资源（已配置）
   - 缓存 API 响应（使用 Redis 或 Vercel KV）

2. **使用 CDN**
   - Vercel 和 Netlify 都内置 CDN
   - 配置适当的缓存策略

3. **压缩响应**
   - 启用 gzip/brotli 压缩（已自动配置）

4. **优化数据库查询**
   - 使用索引
   - 减少 N+1 查询

5. **监控性能**
   - 使用 Vercel Analytics 或 Netlify Analytics
   - 设置性能预算

---

## 总结

通过以上优化，您的应用在部署后应该能够：

1. ✅ 更稳定地连接 Coze API
2. ✅ 自动重试失败的请求
3. ✅ 在 API 失败时优雅降级
4. ✅ 更快地响应用户请求
5. ✅ 在 Vercel 或 Netlify 上稳定运行

如果仍然遇到问题，请检查：
- 环境变量是否正确配置
- API Token 是否有效
- 网络连接是否稳定
- 查看日志获取详细错误信息
