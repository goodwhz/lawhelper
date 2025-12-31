# 牛马测评仪 - 使用说明

## 功能介绍

"牛马测评仪"是一个基于讯飞星辰 AI 的职场处境评估工具，可以帮助用户分析职场问题并获得专业建议。

## 访问方式

### 方法 1: 使用启动脚本（推荐）

在项目根目录下运行：

```bash
.\start-dev.bat
```

然后在浏览器中访问: http://localhost:3000

### 方法 2: 手动启动

在命令行中执行：

```bash
node e:/Workplace/AI/PBL2/lawhelper/node_modules/next/dist/bin/next dev e:/Workplace/AI/PBL2/lawhelper -p 3000
```

### 方法 3: 从主页访问

1. 访问 http://localhost:3000
2. 滚动到"核心功能"部分
3. 找到"🐂🐴 牛马测评仪"卡片
4. 点击进入

### 方法 4: 直接访问

直接访问: http://localhost:3000/niu-ma-evaluator

## 功能特点

- **AI 智能评估**: 使用讯飞星辰 AI 进行多维度职场分析
- **实时对话**: 流式响应，即时获取 AI 分析
- **快捷问题**: 提供常见职场问题的快速入口
- **改善建议**: 基于分析结果提供个性化建议

## 快捷问题

- 经常加班没有加班费
- 领导不合理安排工作
- 工资低于市场水平
- 职场被边缘化
- 没有晋升机会

## 技术实现

- **前端**: React + TypeScript + TailwindCSS
- **后端**: Next.js 16.1.1 API Routes
- **AI 集成**: 讯飞星辰 WebSocket API
- **鉴权**: JWT 自动生成
- **降级策略**: API 失败时提供模拟响应

## API 配置

在 `.env.local` 中配置：

```
SPARK_API_URL=wss://spark-openapi.cn-huabei-1.xf-yun.com/v1/assistants/c6lviwhk2sfk_v1
SPARK_API_KEY=d046679b7afde2f1cb3022612959e818
SPARK_API_SECRET=YTVlMTJmNTliYTM4MmQwOGM0ZTQzMzVi
SPARK_APP_ID=b20ae552
```

## 故障排除

### 如果无法访问 localhost:3000

1. 检查端口是否被占用：
   ```bash
   netstat -ano | findstr :3000
   ```

2. 更换端口：
   ```bash
   node node_modules/next/dist/bin/next dev e:/Workplace/AI/PBL2/lawhelper -p 3001
   ```

3. 使用 127.0.0.1 代替 localhost：
   ```
   http://127.0.0.1:3000
   ```

### 如果 API 调用失败

- 检查网络连接
- 验证 API 密钥是否正确
- 查看浏览器控制台错误信息

## 文件结构

```
lawhelper/
├── app/
│   ├── niu-ma-evaluator/
│   │   └── page.tsx                    # 牛马测评仪页面
│   ├── api/
│   │   └── spark-evaluator/
│   │       └── chat/
│   │           └── route.ts             # 讯飞 API 路由
│   └── components/
│       └── tools/
│           └── niu-ma-evaluator-chat.tsx # 聊天组件
├── .env.local                            # 环境变量配置
└── package.json                          # 依赖配置
```

## 注意事项

- ⚠️ 牛马测评仪的建议仅供参考，不构成专业心理咨询
- ⚠️ 如遇严重职场问题，建议寻求专业心理咨询或职业规划师的帮助
- ⚠️ 保持理性客观的态度对待评估结果
- ✅ AI 响应可能需要几秒钟，请耐心等待

## 支持

如有问题，请：
1. 查看浏览器控制台错误信息
2. 检查服务器终端日志
3. 参考 Next.js 官方文档
