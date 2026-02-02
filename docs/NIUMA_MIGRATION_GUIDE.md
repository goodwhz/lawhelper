# 牛马测评仪 - 数据库迁移指南

## 迁移步骤

### 方式一：通过 Supabase 控制台执行（推荐）

1. **打开 Supabase 控制台**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL 编辑器**
   - 左侧菜单选择 "SQL Editor"
   - 点击 "New query"

3. **执行迁移脚本**
   - 打开文件：`migrations/create_niuma_tables.sql`
   - 复制全部内容
   - 粘贴到 SQL 编辑器
   - 点击 "Run" 执行

4. **验证迁移结果**
   - 检查 Tables 是否包含以下表：
     - `niuma_evaluations`
     - `niuma_evaluation_messages`
     - `niuma_evaluation_results`
   - 检查每个表是否有正确的列和索引
   - 检查 RLS Policies 是否正确设置

### 方式二：使用 Supabase CLI（高级用户）

如果你已安装 Supabase CLI：

```bash
# 应用迁移
npx supabase db push

# 或者使用 migrate
npx supabase migration up
```

## 数据库表结构

### 1. niuma_evaluations（测评对话表）

| 列名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| version | TEXT | 测评版本：simple/normal |
| title | TEXT | 测评标题 |
| status | TEXT | 状态：active/archived/deleted |
| coze_conversation_id | TEXT | Coze对话ID |
| metadata | JSONB | 元数据 |
| settings | JSONB | 测评设置 |
| last_activity_at | TIMESTAMP | 最后活动时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. niuma_evaluation_messages（测评消息表）

| 列名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| evaluation_id | UUID | 测评ID（外键） |
| user_id | UUID | 用户ID（外键） |
| content | TEXT | 消息内容 |
| role | TEXT | 角色：user/assistant/system |
| coze_message_id | TEXT | Coze消息ID |
| message_data | JSONB | 消息附加数据 |
| feedback | JSONB | 用户反馈（点赞/点踩） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. niuma_evaluation_results（测评结果表）

| 列名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| evaluation_id | UUID | 测评ID（外键） |
| user_id | UUID | 用户ID（外键） |
| total_score | DECIMAL | 综合评分（0-100） |
| salary_score | DECIMAL | 薪资回报得分 |
| workload_score | DECIMAL | 工作强度得分 |
| growth_score | DECIMAL | 成长空间得分 |
| environment_score | DECIMAL | 工作环境得分 |
| atmosphere_score | DECIMAL | 团队氛围得分 |
| mental_health_score | DECIMAL | 心理健康得分 |
| evaluation_summary | TEXT | 测评总结 |
| suggestions | TEXT | 改进建议 |
| dimensions | JSONB | 各维度详细数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 安全策略（RLS）

所有表都配置了行级安全策略，确保：
- 用户只能访问自己的数据
- 用户可以创建自己的数据
- 用户可以更新和删除自己的数据

## 索引优化

已创建以下索引以提升查询性能：

### niuma_evaluations
- `idx_niuma_evaluations_user_id` - 按用户ID查询
- `idx_niuma_evaluations_status` - 按状态查询
- `idx_niuma_evaluations_version` - 按版本查询
- `idx_niuma_evaluations_updated_at` - 按更新时间查询

### niuma_evaluation_messages
- `idx_niuma_evaluation_messages_evaluation_id` - 按测评ID查询
- `idx_niuma_evaluation_messages_user_id` - 按用户ID查询
- `idx_niuma_evaluation_messages_created_at` - 按创建时间查询

### niuma_evaluation_results
- `idx_niuma_evaluation_results_evaluation_id` - 按测评ID查询
- `idx_niuma_evaluation_results_user_id` - 按用户ID查询

## 触发器

- `handle_niuma_updated_at` - 自动更新 `updated_at` 字段

## 测试迁移

迁移完成后，访问以下页面测试：

1. 牛马测评仪首页：`http://localhost:3000/niu-ma-evaluator`
2. 创建新的简易版测评
3. 创建新的正常版测评
4. 检查侧边栏是否显示测评列表
5. 检查消息是否正确保存
6. 检查测评结果是否正确提取和显示

## 故障排查

### 问题：表已存在错误

**解决方案**：先删除表，再重新执行迁移

```sql
DROP TABLE IF EXISTS public.niuma_evaluation_results CASCADE;
DROP TABLE IF EXISTS public.niuma_evaluation_messages CASCADE;
DROP TABLE IF EXISTS public.niuma_evaluations CASCADE;
```

### 问题：权限错误

**解决方案**：确保在 Supabase 控制台中使用管理员权限执行迁移

### 问题：API 返回 404

**解决方案**：
1. 检查表是否创建成功
2. 检查 RLS 策略是否正确配置
3. 确保用户已登录

## 回滚迁移

如果需要回滚迁移：

```sql
-- 删除策略
DROP POLICY IF EXISTS "用户可以查看自己的测评" ON public.niuma_evaluations;
DROP POLICY IF EXISTS "用户可以创建自己的测评" ON public.niuma_evaluations;
DROP POLICY IF EXISTS "用户可以更新自己的测评" ON public.niuma_evaluations;
DROP POLICY IF EXISTS "用户可以删除自己的测评" ON public.niuma_evaluations;
-- (其他类似...)

-- 删除触发器
DROP TRIGGER IF EXISTS niuma_evaluations_updated_at ON public.niuma_evaluations;
DROP TRIGGER IF EXISTS niuma_evaluation_messages_updated_at ON public.niuma_evaluation_messages;
DROP TRIGGER IF EXISTS niuma_evaluation_results_updated_at ON public.niuma_evaluation_results;

-- 删除函数
DROP FUNCTION IF EXISTS public.handle_niuma_updated_at();

-- 删除表
DROP TABLE IF EXISTS public.niuma_evaluation_results CASCADE;
DROP TABLE IF EXISTS public.niuma_evaluation_messages CASCADE;
DROP TABLE IF EXISTS public.niuma_evaluations CASCADE;
```
