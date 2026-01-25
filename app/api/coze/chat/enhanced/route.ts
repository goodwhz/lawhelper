/**
 * Coze Chat API - 增强版
 * 集成会话管理、心跳保活和自动重连
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionManager } from '@/lib/coze/session-manager'

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 2000
const REQUEST_TIMEOUT = 60000

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 从环境变量获取 Coze 配置
const getCozeConfig = () => {
  const cozeApiUrl = process.env.COZE_API_URL
  const cozeApiToken = process.env.COZE_API_TOKEN
  const cozeProjectId = process.env.COZE_PROJECT_ID || '7589147310182039571'

  return { cozeApiUrl, cozeApiToken, cozeProjectId }
}

// 带重试的 fetch 请求
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok && retries > 0) {
      const shouldRetry = response.status >= 500 || response.status === 429 || response.status === 408
      if (shouldRetry) {
        console.log(`请求失败 (${response.status}), ${retries} 次重试中...`)
        await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1))
        return fetchWithRetry(url, options, retries - 1)
      }
    }

    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('Fetch 错误:', error)

    const shouldRetry = retries > 0 && (
      error.name === 'AbortError'
      || error.message?.includes('network')
      || error.message?.includes('ECONN')
      || error.message?.includes('ETIMEDOUT')
      || error.message?.includes('fetch failed')
    )

    if (shouldRetry) {
      console.log(`网络错误, ${retries} 次重试中...`)
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1))
      return fetchWithRetry(url, options, retries - 1)
    }

    throw error
  }
}

// 调用 Coze API（带会话管理）
async function callCozeAPIWithSession(
  requestBody: any,
  cozeConfig: ReturnType<typeof getCozeConfig>,
  sessionManager: ReturnType<typeof getSessionManager>,
  sessionId: string,
): Promise<string> {
  console.log('开始调用 Coze API... 会话:', sessionId)

  const { cozeApiUrl, cozeApiToken } = cozeConfig

  // 如果有 conversationId，添加到请求中
  if (sessionId) {
    const session = sessionManager.sessions?.get(sessionId)
    if (session?.conversationId) {
      requestBody.conversation_id = session.conversationId
    }
  }

  const response = await fetchWithRetry(cozeApiUrl!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cozeApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Coze API 错误:', response.status, errorText)
    throw new Error(`Coze API 错误: ${response.status}`)
  }

  // 处理流式响应
  const responseText = await response.text()
  console.log('=== Coze API 响应详情 ===')
  console.log('响应长度:', responseText.length)

  // 解析流式响应，提取答案
  let aiResponse = ''
  const lines = responseText.split('\n')

  for (const line of lines) {
    if (!line.trim() || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('data: ')) {
      const dataStr = line.substring(6).trim()

      if (!dataStr || dataStr === '[DONE]' || dataStr === 'done') {
        continue
      }

      try {
        const data = JSON.parse(dataStr)

        if (data.content && data.content.answer) {
          aiResponse += data.content.answer
        } else if (data.answer && typeof data.answer === 'string') {
          aiResponse += data.answer
        } else if (data.message && typeof data.message === 'string') {
          aiResponse += data.message
        } else if (data.choices && data.choices[0]?.delta?.content) {
          aiResponse += data.choices[0].delta.content
        } else if (data.delta && data.delta.content) {
          aiResponse += data.delta.content
        } else if (typeof data === 'string') {
          aiResponse += data
        }
      } catch (e) {
        console.error('解析 SSE 行失败:', line.substring(0, 200))
      }
    }
  }

  console.log('提取的 AI 响应长度:', aiResponse.length)

  // 清理响应
  let cleanedResponse = aiResponse.replace(/\[object Object\]/g, '').trim()

  cleanedResponse = cleanedResponse
    .replace(/\|/g, '-')
    .replace(/```([a-z]*)\s*$/gm, (match, lang) => `\`\`\`${lang}\n`)
    .replace(/\\_/g, '_')
    .replace(/  +/g, ' ')
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')

  if (!cleanedResponse) {
    console.error('未收到有效的AI响应，原始响应:', responseText)
    throw new Error('未收到有效的AI响应')
  }

  // 更新会话
  await sessionManager.sendMessage(sessionId, requestBody.content.query.prompt[0].content.text)

  return cleanedResponse
}

// 生成模拟响应
function generateMockResponse(disputeType: string, _description: string): string {
  const responses: Record<string, string> = {
    工资争议: `## 工资争议分析

根据您提供的工资争议情况，我为您提供以下分析和建议：

### 问题分析

- 工资拖欠属于严重的劳动违法行为
- 根据《劳动法》第50条，工资应当按月足额支付给劳动者本人

### 法律依据

- 《劳动合同法》第85条：未及时足额支付劳动报酬的，用人单位应当支付赔偿金
- 可要求支付工资100%-200%的赔偿金

### 建议步骤

1. **收集证据** - 工资条、银行流水、劳动合同、工作证明
2. **沟通协商** - 与HR或财务部门书面沟通，要求补发工资
3. **劳动监察** - 向当地劳动监察大队投诉（举报电话：12333）
4. **劳动仲裁** - 申请劳动仲裁，要求支付工资和赔偿金
5. **法律诉讼** - 仲裁不服可向法院起诉

### 重要提示

- 劳动争议仲裁时效为1年
- 建议优先通过劳动监察解决，效率较高
- 保留所有证据材料是维权成功的关键`,

    解除合同: `## 解除合同争议分析

根据您提到的解除合同争议，以下是法律分析：

### 问题分析

- 用人单位解除劳动合同需要符合法定条件
- 需要支付经济补偿金或赔偿金

### 法律依据

- 《劳动合同法》第47条：经济补偿按工作年限，每年1个月工资
- 第87条：违法解除需支付2倍赔偿金

### 建议步骤

1. **确认解除理由** - 查看解除通知书，了解解除原因
2. **审查合法性** - 判断解除是否符合法律规定
3. **协商解决** - 要求支付法定补偿或赔偿
4. **劳动仲裁** - 申请仲裁维护权益
5. **法律援助** - 复杂案件可申请法律援助

### 重要提示

- N+1补偿：标准经济补偿
- 2N赔偿：违法解除的赔偿
- 及时行动，不要错过时效`,

    加班费: `## 加班费争议分析

针对加班费争议，为您提供专业建议：

### 问题分析

- 加班费应当按法律标准支付
- 不支付加班费属于违法行为

### 法律依据

- 《劳动法》第44条：加班费支付标准
- 工作日：150%；休息日：200%；法定假日：300%

### 建议步骤

1. **收集加班证据** - 考勤记录、工作邮件、加班通知
2. **计算应得加班费** - 按法律规定标准计算
3. **书面沟通** - 要求用人单位支付加班费
4. **劳动仲裁** - 申请仲裁维护权益

### 重要提示

- 保留加班证据是关键
- 计算清楚应得金额
- 可要求支付额外的赔偿金`,

    default: `## 劳动争议分析

根据您描述的争议情况，我为您提供以下建议：

### 情况分析

- 您遇到了劳动纠纷问题
- 需要通过合法途径维护自身权益

### 一般建议步骤

1. **收集证据** - 保存所有相关文件和记录
2. **沟通协商** - 尝试通过沟通解决问题
3. **寻求调解** - 向劳动部门申请调解
4. **劳动仲裁** - 向劳动仲裁委员会申请仲裁
5. **法律诉讼** - 仲裁不服可向法院起诉

### 重要提示

- 劳动争议仲裁时效为1年
- 证据收集非常重要
- 复杂案件建议咨询专业律师
- 保持冷静和理性，依法维权`,
  }

  return responses[disputeType] || responses.default
}

export async function POST(request: NextRequest) {
  const sessionManager = getSessionManager()

  try {
    console.log('=== Coze Chat API (增强版) 开始处理 ===')

    const body = await request.json()
    console.log('接收到的请求体:', body)

    const { disputeType, description, userId = 'anonymous', sessionId } = body

    if (!disputeType || !description) {
      console.log('参数验证失败: 缺少必要参数')
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数',
        },
        { status: 400 },
      )
    }

    const cozeConfig = getCozeConfig()
    console.log('Coze 配置:', {
      apiUrl: cozeConfig.cozeApiUrl,
      hasToken: !!cozeConfig.cozeApiToken,
      projectId: cozeConfig.cozeProjectId,
    })

    // 如果没有配置 Token，返回模拟响应
    if (!cozeConfig.cozeApiToken || cozeConfig.cozeApiToken === '<YOUR_TOKEN>') {
      console.log('Coze API Token 未配置，返回模拟响应')
      const mockResponse = generateMockResponse(disputeType, description)
      return NextResponse.json({
        success: true,
        data: {
          analysis: {
            summary: mockResponse,
            raw: { mock: true, reason: 'No Token' },
          },
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 获取或创建会话
    let currentSessionId = sessionId

    if (!currentSessionId) {
      const session = await sessionManager.getOrCreateSession(userId)
      currentSessionId = session.id
    }

    console.log('使用会话:', currentSessionId)

    // 构建请求体
    const requestBody = {
      content: {
        query: {
          prompt: [
            {
              type: 'text',
              content: {
                text: `争议类型: ${disputeType}\n具体情况: ${description}\n\n请根据上述信息提供专业的法律分析和建议。`,
              },
            },
          ],
        },
      },
      type: 'query',
      project_id: parseInt(cozeConfig.cozeProjectId!),
    }

    console.log('发送到 Coze 的请求:', JSON.stringify(requestBody, null, 2))

    // 调用 Coze API
    const aiResponse = await callCozeAPIWithSession(
      requestBody,
      cozeConfig,
      sessionManager,
      currentSessionId,
    )

    // 获取会话统计
    const sessionStats = sessionManager.getStats()

    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          summary: aiResponse,
          raw: null,
        },
        sessionId: currentSessionId,
        sessionStats,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Coze 评估错误:', error)

    // 发生错误时返回 mock response
    const mockResponse = generateMockResponse(
      body?.disputeType || '劳动争议',
      body?.description || '未提供描述',
    )

    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          summary: mockResponse,
          raw: { mock: true, error: error.message },
        },
      },
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * GET - 获取会话统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const sessionManager = getSessionManager()
    const stats = sessionManager.getStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('获取会话统计错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
