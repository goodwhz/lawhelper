# Netlify 部署快速检查清单

## ✅ 部署前检查

### 1. 代码检查
- [ ] `netlify.toml` 已更新(包含函数配置和API重定向)
- [ ] `app/api/coze/chat/route.ts` 已优化(重试机制)
- [ ] `app/api/spark-evaluator/chat/route.ts` 已优化(重试机制)
- [ ] `app/components/tools/dispute-questionnaire.tsx` 已优化(重连逻辑)
- [ ] `app/components/tools/niu-ma-evaluator-chat.tsx` 已优化(重连逻辑)

### 2. 本地测试
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 本地运行 `npm run dev` 测试所有功能
- [ ] 测试争议解决中心功能
- [ ] 测试牛马测评仪功能
- [ ] 测试重连功能

---

## ✅ Netlify 配置

### 1. 环境变量配置

在 Netlify Dashboard **Site settings** → **Environment variables** 中添加:

#### Supabase 配置
```
NEXT_PUBLIC_SUPABASE_URL=https://duyfvvbgadrwaonvlrun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MzYyMCwiZXhwIjoyMDc1ODU5NjIwfQ.Ens_KrmOz0j_V3mq637j2-AjD1Mh4oHr4NblJTiJMT8
```

#### Dify AI 配置
```
NEXT_PUBLIC_APP_ID=5e18f32a-f037-4eb6-92fc-4fd1bb1b0923
NEXT_PUBLIC_APP_KEY=app-eNk3GtruKTh2pHmcBk7g6gs4
NEXT_PUBLIC_API_URL=https://dify.aipfuture.com/v1
DIFY_API_URL=https://dify.aipfuture.com/v1
DIFY_APP_KEY=app-eNk3GtruKTh2pHmcBk7g6gs4
DIFY_APP_ID=5e18f32a-f037-4eb6-92fc-4fd1bb1b0923
```

#### Coze API 配置(争议解决中心)
```
COZE_API_URL=https://x6yjs8hc3k.coze.site/stream_run
COZE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NWIzNDljLTE5ZWItNGVhMC1iY2YzLTYwODFmY2Q4OTIyZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkREdzJSeVRvemxCY25KZTFGc25pY0RXOExNVndZNE1MIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NDk0MDkyLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5MTU5MzczNTM3MDE3ODk3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxMzI5MzI0Mzk4MDE4NjAzIn0.NCJPVXl_1I7ajX2QruY1wvZO9TAHVJ4qHJxF82VjzZyyewP2MJDN2afzPZmTH7tyZgJrA5cEz6S8jeYqUrFDUUe3lcE6ImQDi9KdwoWeR5IvOpYyEODwjKmyBCKTL38d2nsArApFXgBRz2PIRmJKhtSS6Re8nR0N_p0nFTqt8v1IabwMYdaJ8Wq8BsAdv1FwJF0Ru_ruh7aseeoo0HymdKH2iPWlYRfnNteJHkAK_XVGoUrR2b__d2syoQ6SuiXVjokpLHbWJ4SWtTEb7K0sxdT39Pr2xevKActb7vw77SvD7cII_fBpLHbhQl1mtoAnyDnHWXP2kwF61n9rnaGunA
COZE_PROJECT_ID=7589159373537017897
```

#### Coze API 配置(牛马测评仪)
```
NIUMA_COZE_API_URL=https://qz6hgwr9c2.coze.site/stream_run
NIUMA_COZE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NWIzNDljLTE5ZWItNGVhMC1iY2YzLTYwODFmY2Q4OTIyZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkVZdE5SRm9vRkl0bXR2SjBOT0hlbGQxdXRjSFJOeFBWIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NTI3MDM5LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5OTM0NDk0ODIwMzM1NjM1Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxNDcwODI4MjEwODgwNTY0In0.qUTzs6B5HTXvugr1Zbz2ekHhshnc0ryv_gPWxuKfK3zdVcr-wHkjbSBlz50WVg8j7fXjZ3xYbIIa91BFtJZPgQJDXaeGHK73jlpIHbCR7YdIczVflEwRn0qkJRuXFxFZ7MY6oMQMalxz08w8AK2btfgUvBto-Y1iRzcsl0nlpI0y3biZDrAXLyXPSy2MN9LWIInWO-yhg45r5tD758bvhfSSDjh6v0FyhgILSUB-kH8l7WP3TzP6ihyhVjPEsezy9VYnX183lsbnQDqWSDlABsyTC41G9cyNcpbB8MC4zRMEOXtaiHYzuQIZbrKOZF7laIRa-IefdV5kfCuoynVBZg
NIUMA_COZE_PROJECT_ID=7589925531894808617
```

#### 其他配置
```
NEXT_TELEMETRY_DISABLED=1
```

### 2. 构建配置
- [ ] Build command: `npm run build`
- [ ] Publish directory: `.next`
- [ ] Node version: 20

### 3. 函数配置
- [ ] Functions timeout: 60s (全局)
- [ ] `/api/coze/*` timeout: 90s
- [ ] `/api/spark-evaluator/*` timeout: 90s
- [ ] `/api/dify/*` timeout: 90s

---

## ✅ 部署流程

### 1. 通过 Git 部署
1. 提交代码:
```bash
git add .
git commit -m "fix: 优化Netlify部署连接稳定性"
git push
```

2. 在 Netlify Dashboard 中:
- [ ] 连接到 Git 仓库
- [ ] 选择正确的分支
- [ ] 检查构建命令和发布目录
- [ ] 点击 **Deploy site**

### 2. 通过 CLI 部署
```bash
# 安装 CLI
npm install -g netlify-cli

# 登录
netlify login

# 初始化
netlify init

# 部署
netlify deploy --prod
```

---

## ✅ 部署后验证

### 1. 检查部署状态
- [ ] 部署成功完成
- [ ] 无构建错误
- [ ] 无函数部署失败

### 2. 检查环境变量
- [ ] 访问 Netlify Dashboard
- [ ] Site settings → Environment variables
- [ ] 确认所有环境变量已添加

### 3. 检查函数日志
- [ ] Deployments → 选择部署版本 → Functions logs
- [ ] 检查是否有错误
- [ ] 查看超时和网络错误

### 4. 功能测试

#### 争议解决中心
- [ ] 问卷填写正常
- [ ] 提交分析成功
- [ ] AI 响应正常
- [ ] 重连功能正常

#### 牛马测评仪
- [ ] 对话交互正常
- [ ] AI 响应正常
- [ ] 重连功能正常

#### 智能问答
- [ ] Dify API 连接正常
- [ ] 流式响应正常

---

## ✅ 故障排除

### 问题: 函数超时
**解决方案:**
- 检查 `netlify.toml` 中的 timeout 配置
- 增加超时时间到 90s 或 120s
- 优化 API 响应时间

### 问题: 环境变量未生效
**解决方案:**
- 确认变量已在 Dashboard 中添加
- 重新部署项目
- 检查变量名称是否正确

### 问题: API 路由 404
**解决方案:**
- 检查 `netlify.toml` 中的重定向规则
- 重新部署项目
- 清除浏览器缓存

### 问题: 重连失败
**解决方案:**
- 检查 Netlify Functions 日志
- 确认 API Token 有效
- 检查网络连接
- 刷新页面重新初始化

---

## ✅ 监控和维护

### 日常检查
- [ ] 每周检查 Functions logs
- [ ] 监控 API 响应时间
- [ ] 检查错误率

### 性能优化
- [ ] 定期查看 Netlify Analytics
- [ ] 优化慢速函数
- [ ] 检查缓存策略

### 安全检查
- [ ] 定期更新 API Token
- [ ] 检查环境变量安全性
- [ ] 审查函数访问权限

---

## 📞 获取帮助

### Netlify 文档
- [Functions 文档](https://docs.netlify.com/functions/)
- [环境变量配置](https://docs.netlify.com/site-configuration/variables/)
- [部署配置](https://docs.netlify.com/configure-builds/file-based-configuration/)

### 常见问题
- [Netlify FAQ](https://answers.netlify.com/)
- [Community Forum](https://community.netlify.com/)

### 本地支持
- 查看 `NETLIFY_DEPLOYMENT_GUIDE.md` 获取详细指南
- 查看 `COZE_CONNECTION_IMPROVEMENTS.md` 了解连接改进

---

## 🎯 快速参考

### 重要的 Netlify 配置
```toml
[functions]
  timeout = 60
  node_bundler = "esbuild"

[functions."/api/coze/*"]
  timeout = 90

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true
```

### 环境变量检查命令
```bash
# Netlify CLI
netlify env:list

# 在函数中检查
console.log('ENV:', process.env)
```

### 查看日志
```bash
# 实时日志
netlify logs --tail

# 函数日志
netlify functions:log
```

---

**最后更新:** 2025-01-08
**版本:** 1.0.0
**维护者:** AI Assistant
