# Coze 对话式争议解决配置指南

## 概述

争议解决中心已经更新为使用 Coze AI 对话式界面,用户可以通过自然语言描述争议问题,AI 助手会提供专业的法律分析和建议。

## 配置步骤

### 1. 获取 Coze API Token

1. 访问 Coze 平台并创建项目
2. 获取 API Token (Bearer Token)
3. 获取 Project ID

### 2. 配置环境变量

编辑 `.env.local` 文件,替换以下变量:

```env
COZE_API_URL=https://x6yjs8hc3k.coze.site/stream_run
COZE_API_TOKEN=<YOUR_TOKEN>  # 替换为您的实际 Token
COZE_PROJECT_ID=7589147310182039571  # 替换为您的项目 ID
```

### 3. 重启开发服务器

配置完成后,需要重启开发服务器以使环境变量生效:

```bash
npm run dev
```

## 功能特性

### 对话式界面
- 自然语言交互,无需填写复杂的表单
- 实时响应,快速获取建议
- 支持快捷问题,快速开始咨询

### 智能分析
- 基于用户描述自动分析争议类型
- 提供个性化的解决建议
- 支持多种争议类型(工资、解除合同、加班费、晋升等)

### API 路由

#### POST /api/coze/chat

请求体:
```json
{
  "disputeType": "劳动争议",
  "description": "用户描述的争议情况"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": "AI 的分析结果",
      "raw": "Coze API 原始响应"
    }
  },
  "timestamp": "2025-12-29T07:30:00.000Z"
}
```

## 组件说明

### CozeDisputeChat 组件

位置: `app/components/tools/coze-dispute-chat.tsx`

主要功能:
- 消息列表显示
- 用户输入和发送
- 加载状态显示
- 快捷问题按钮
- 自动滚动到底部

### 争议解决中心页面

位置: `app/dispute-center/page.tsx`

主要功能:
- 智能对话界面集成
- 功能特性展示
- 法律提示信息

## 使用示例

用户可以输入以下类型的问题:

1. **工资争议**: "公司最近三个月没有按时发工资,我该怎么办?"
2. **解除合同**: "公司突然通知解除合同,没有给予合理赔偿"
3. **加班费**: "经常加班但没有支付加班费,如何维权?"
4. **晋升争议**: "工作表现优秀但没有获得晋升"
5. **调岗争议**: "公司未经同意将我调到其他岗位"

## 注意事项

1. **API Token 安全**: 不要将 `.env.local` 文件提交到版本控制系统
2. **时效性**: 劳动争议处理时效为1年,请及时行动
3. **证据保留**: 保留所有相关证据是维权成功的关键
4. **专业建议**: AI 助手的建议仅供参考,复杂案件建议咨询专业律师
5. **网络连接**: 确保 Coze API 可以正常访问

## 测试

可以通过以下方式测试功能:

1. 启动开发服务器
2. 访问 `/dispute-center` 页面
3. 在对话界面输入问题
4. 检查浏览器控制台和网络请求

## 故障排查

### 问题: 调用 Coze API 失败

解决方案:
1. 检查 `.env.local` 文件中的 `COZE_API_TOKEN` 是否正确
2. 确认网络可以访问 Coze API URL
3. 检查 API Token 是否有效且未过期

### 问题: 没有收到 AI 响应

解决方案:
1. 检查浏览器控制台的错误信息
2. 确认 Coze API 返回的数据格式
3. 检查网络请求是否成功

## 相关文件

- `app/components/tools/coze-dispute-chat.tsx` - 对话组件
- `app/dispute-center/page.tsx` - 争议解决中心页面
- `app/api/coze/chat/route.ts` - Coze API 路由
- `.env.local` - 环境变量配置
