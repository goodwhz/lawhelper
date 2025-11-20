# 劳动法助手 Vercel 部署指南

## 修复的问题

### 1. Supabase 配置问题
- ✅ 修复了环境变量缺失问题
- ✅ 优化了客户端初始化
- ✅ 增强了错误处理和日志

### 2. API 路由问题
- ✅ 修复了 `/api/law/[filename]/route.ts` 的语法错误
- ✅ 添加了 CORS 支持用于 Vercel 部署
- ✅ 增加了搜索功能

### 3. 数据库连接问题
- ✅ 创建了数据库初始化脚本
- ✅ 添加了健康检查端点
- ✅ 优化了错误处理

### 4. 构建配置问题
- ✅ 修复了 Next.js 15 配置警告
- ✅ 优化了 Vercel 部署配置
- ✅ 添加了环境变量传递

## 部署步骤

### 1. 确保代码已提交
```bash
git add .
git commit -m "Fix Vercel deployment issues"
git push origin main
```

### 2. Vercel 环境变量配置
在 Vercel 项目设置中确保以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://duyfvvbgadrwaonvlrun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iFuGawfaXjf4aGic61EgIg_FPEMcqed
NODE_ENV=production
```

### 3. 数据库初始化
部署完成后，访问以下 URL 初始化数据库：

```
https://your-domain.vercel.app/debug
```

点击"初始化数据库"按钮来创建必要的表结构和基础数据。

### 4. 验证部署
检查以下端点是否正常工作：

- 知识库: `https://your-domain.vercel.app/knowledge`
- 健康检查: `https://your-domain.vercel.app/api/health-check`
- 数据 API: `https://your-domain.vercel.app/api/law-data`
- 调试页面: `https://your-domain.vercel.app/debug`

## 新增功能

### 1. 健康检查 API (`/api/health-check`)
- 检查环境变量配置
- 测试 Supabase 连接
- 验证数据库表结构
- 提供详细的错误信息和修复建议

### 2. 数据库初始化 API (`/api/init-database`)
- 创建必要的数据库表
- 插入基础分类数据
- 设置 RLS 策略
- 配置索引

### 3. 调试页面 (`/debug`)
- 显示系统健康状态
- 环境变量检查
- 数据库连接测试
- 一键初始化数据库
- API 端点测试

### 4. 增强的错误处理
- 详细的错误日志
- 用户友好的错误提示
- 自动重试机制
- 渐进式降级

## 文件结构

```
app/
├── api/
│   ├── health-check/route.ts     # 健康检查 API
│   ├── init-database/route.ts     # 数据库初始化 API
│   ├── law-data/route.ts         # 数据获取 API (已优化)
│   └── law/[filename]/route.ts   # 文件服务 API (已修复)
├── debug/page.tsx                # 调试页面 (新增)
└── components/
    ├── knowledge-base.tsx        # 知识库组件 (已优化)
    └── document-preview.tsx      # 文档预览组件

lib/
└── supabaseClient.ts             # Supabase 客户端 (已修复)

scripts/
└── setup-database.sql            # 数据库初始化脚本

vercel.json                       # Vercel 配置 (已优化)
next.config.js                    # Next.js 配置 (已优化)
```

## 常见问题解决

### 1. "数据加载失败"错误
- 检查 Supabase 环境变量是否正确
- 访问 `/debug` 页面查看详细错误信息
- 确保数据库表已创建

### 2. "环境变量缺失"错误
- 确保在 Vercel 项目设置中配置了所有必需的环境变量
- 检查 `vercel.json` 配置是否正确

### 3. API 请求失败
- 检查 CORS 配置
- 确认 Supabase RLS 策略正确设置
- 查看 Vercel 函数日志

## 监控和维护

1. **定期检查健康状态**：访问 `/api/health-check`
2. **监控错误日志**：在 Vercel 控制台查看函数日志
3. **性能监控**：使用 Vercel Analytics 监控网站性能
4. **数据库备份**：定期备份 Supabase 数据库

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 错误截图
2. `/debug` 页面的健康检查结果
3. Vercel 函数日志
4. 浏览器控制台错误

---

部署完成后，劳动法知识库应该能够正常加载法律法规数据，支持搜索、分类筛选和文档预览功能。