# 牛马测评仪 - 历史记录功能使用说明

## 功能概述

牛马测评仪历史记录功能已成功集成,包含以下核心功能:

### 1. 自动保存测评记录
- 测评完成后自动识别并提示保存
- 支持自定义测评标题
- 保存完整的测评数据(包括多维度评分、总结、建议等)

### 2. 测评历史列表
- 查看所有历史测评记录
- 显示每条记录的详细信息:
  - 综合评分
  - 六个维度评分(薪资回报、工作强度、成长空间、工作环境、团队氛围、心理健康)
  - 测评总结
  - 测评时间

### 3. 评分趋势图
- 使用Recharts库绘制折线图
- 可视化展示评分变化趋势
- 支持多维度对比(可选择显示特定维度的趋势)
- 时间轴显示测评日期

### 4. 数据管理
- 用户只能查看和删除自己的记录(RLS策略保护)
- 支持删除单条记录(需二次确认)
- 测评详情弹窗查看完整信息

## 技术实现

### 数据库表结构

```sql
evaluation_history
├── id: UUID (主键)
├── user_id: UUID (用户ID,外键)
├── title: VARCHAR(255) (测评标题)
├── evaluation_date: TIMESTAMP (测评日期)
├── total_score: DECIMAL(5,2) (综合评分 0-100)
├── salary_score: DECIMAL(5,2) (薪资回报评分)
├── workload_score: DECIMAL(5,2) (工作强度评分)
├── growth_score: DECIMAL(5,2) (成长空间评分)
├── environment_score: DECIMAL(5,2) (工作环境评分)
├── atmosphere_score: DECIMAL(5,2) (团队氛围评分)
├── mental_health_score: DECIMAL(5,2) (心理健康评分)
├── evaluation_summary: TEXT (测评总结)
├── suggestions: TEXT[] (建议列表)
├── chat_history: JSONB (聊天历史)
├── metadata: JSONB (额外元数据)
├── created_at: TIMESTAMP (创建时间)
└── updated_at: TIMESTAMP (更新时间)
```

### API接口

#### 1. GET /api/evaluations
获取用户的所有测评记录

**Query参数:**
- `limit`: 返回数量(默认10)
- `offset`: 偏移量(默认0)

**响应:**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "limit": 10,
  "offset": 0
}
```

#### 2. POST /api/evaluations
创建新的测评记录

**请求体:**
```json
{
  "title": "测评标题",
  "total_score": 85.5,
  "salary_score": 80.0,
  "workload_score": 70.0,
  ...
}
```

#### 3. GET /api/evaluations/[id]
获取单个测评记录详情

#### 4. DELETE /api/evaluations/[id]
删除测评记录

#### 5. PUT /api/evaluations/[id]
更新测评记录

### 组件结构

```
app/
├── components/
│   ├── tools/
│   │   └── niu-ma-evaluator-chat.tsx (修改:添加历史记录功能)
│   └── evaluation/
│       ├── EvaluationHistoryList.tsx (历史记录列表)
│       └── EvaluationTrendChart.tsx (趋势图)
├── api/
│   └── evaluations/
│       ├── route.ts (列表和创建接口)
│       └── [id]/
│           └── route.ts (详情、删除、更新接口)
└── niu-ma-evaluator-test/ (测试页面)
    └── page.tsx
```

## 使用流程

### 用户视角

1. **开始测评**
   - 进入牛马测评仪页面
   - 与AI对话完成测评

2. **自动保存**
   - AI返回测评结果后,系统自动检测
   - 弹出保存提示对话框
   - 输入测评标题(可自定义)
   - 点击"保存"

3. **查看历史**
   - 点击页面右上角"📊 历史记录"按钮
   - 进入历史记录页面
   - 可切换查看列表或趋势图

4. **管理记录**
   - 在列表中点击"查看详情"查看完整信息
   - 点击"删除"删除单条记录(需确认)
   - 趋势图中查看评分变化

### 开发者视角

1. **数据库准备**
   ```bash
   # 迁移已自动执行,无需手动操作
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **测试功能**
   - 访问 `/niu-ma-evaluator` 进行测评
   - 访问 `/niu-ma-evaluator-test` 查看历史记录

## 依赖包

新增依赖:
- `recharts`: 用于绘制趋势图

```bash
npm install recharts
```

## 安全措施

1. **行级安全策略(RLS)**
   - 用户只能查看自己的记录
   - 用户只能创建自己的记录
   - 用户只能删除自己的记录
   - 用户只能更新自己的记录

2. **Token验证**
   - API接口需要Bearer Token
   - Token从Supabase Session中获取

## 注意事项

1. **Coze智能体输出格式**
   - 为了自动提取评分数据,建议在Coze智能体的Prompt中加入评分维度的输出
   - 示例输出格式:
     ```json
     {
       "total_score": 85,
       "dimensions": {
         "薪资回报": {"score": 80, "factors": [...]},
         "工作强度": {"score": 70, "factors": [...]}
       },
       "summary": "...",
       "suggestions": [...]
     }
     ```

2. **数据提取逻辑**
   - 当前支持从以下来源提取评分:
     - JSON格式数据块
     - 正则匹配"综合评分: XX"
     - 关键词检测(测评完成、综合评分等)
   - 如果提取失败,使用默认分数75分

3. **浏览器兼容性**
   - 需要支持ES6的现代浏览器
   - 建议使用Chrome、Firefox、Safari最新版本

## 后续优化建议

1. **数据增强**
   - 添加行业对比数据
   - 添加职级基准数据
   - 添加地域差异分析

2. **功能扩展**
   - 导出测评报告(PDF)
   - 分享测评结果(匿名)
   - 测评对比(选择两条记录对比)

3. **用户体验**
   - 添加引导提示
   - 优化保存提示UI
   - 添加空状态插画

4. **性能优化**
   - 添加分页加载
   - 实现虚拟滚动(大量记录时)
   - 缓存历史记录数据

## 故障排除

### 测评记录无法保存
- 检查是否已登录
- 检查Supabase连接是否正常
- 查看浏览器控制台错误

### 历史记录列表为空
- 确认已完成测评并保存
- 检查API接口是否正常
- 查看数据库中的数据

### 趋势图不显示
- 需要至少2条测评记录
- 检查数据格式是否正确
- 查看浏览器控制台是否有图表库错误
