import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 重试配置
const MAX_RETRIES = 5
const RETRY_DELAY = 2000 // 2秒
const REQUEST_TIMEOUT = 60000 // 60秒超时

// 简易版的 Coze 配置
const getSimpleCozeConfig = () => {
  const cozeApiUrl = process.env.NIUMA_SIMPLE_COZE_API_URL || process.env.SIMPLE_COZE_API_URL || 'https://qz6hgwr9c2.coze.site/stream_run'
  const cozeApiToken = process.env.NIUMA_SIMPLE_COZE_API_TOKEN || process.env.SIMPLE_COZE_API_TOKEN
  const cozeProjectId = process.env.NIUMA_SIMPLE_COZE_PROJECT_ID || process.env.SIMPLE_COZE_PROJECT_ID || '7589925531894808617'

  return { cozeApiUrl, cozeApiToken, cozeProjectId }
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

    // 如果是 5xx 错误或 429 限流，可以重试
    if (!response.ok && retries > 0) {
      const shouldRetry = response.status >= 500 || response.status === 429 || response.status === 408
      if (shouldRetry) {
        console.log(`请求失败 (${response.status})，${retries} 次重试中...`)
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
      console.log(`网络错误，${retries} 次重试中...`)
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1))
      return fetchWithRetry(url, options, retries - 1)
    }

    throw error
  }
}

// 调用简易版 Coze API
async function callSimpleCozeAPI(message: string, cozeConfig: ReturnType<typeof getSimpleCozeConfig>): Promise<string> {
  try {
    console.log('调用简易版 Coze API...')

    const { cozeApiUrl, cozeApiToken, cozeProjectId } = cozeConfig

    const response = await fetchWithRetry(cozeApiUrl!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cozeApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: {
                  text: message,
                },
              },
            ],
          },
        },
        type: 'query',
        project_id: Number.parseInt(cozeProjectId!, 10),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('简易版 Coze API 错误:', response.status, errorText)
      throw new Error(`简易版 Coze API 错误: ${response.status}`)
    }

    // 处理流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) { break }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            continue
          }
          try {
            const parsed = JSON.parse(data)
            console.log('解析的简易版 SSE 数据:', JSON.stringify(parsed))

            let textToAdd = ''

            if (parsed.content && typeof parsed.content.answer === 'string') {
              textToAdd = parsed.content.answer
            } else if (parsed.answer && typeof parsed.answer === 'string') {
              textToAdd = parsed.answer
            } else if (parsed.message && typeof parsed.message === 'string') {
              textToAdd = parsed.message
            } else if (parsed.content && typeof parsed.content === 'string') {
              textToAdd = parsed.content
            } else if (parsed.content && parsed.content.answer) {
              textToAdd = String(parsed.content.answer)
            }

            if (textToAdd) {
              fullResponse += textToAdd
            }
          } catch {
            console.warn('解析简易版 SSE 数据失败:', line.substring(0, 100))
          }
        }
      }
    }

    console.log('简易版 Coze API 响应成功,响应长度:', fullResponse.length)
    console.log('响应内容前200字:', fullResponse.substring(0, 200))

    const cleanedResponse = fullResponse.replace(/\[object Object\]/g, '').trim()

    console.log('简易版完整响应内容:', cleanedResponse)

    if (!cleanedResponse) {
      console.error('简易版 Coze 返回了空响应!')
      throw new Error('未收到有效的简易版 AI 响应')
    }

    return cleanedResponse
  } catch (error) {
    console.error('调用简易版 Coze API 失败:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 简易版 Coze Chat API 开始处理 ===')

    const body = await request.json()
    console.log('简易版接收到的请求体:', body)

    const { message } = body

    if (message === null || message === undefined) {
      console.log('简易版参数验证失败: 消息内容为 null 或 undefined')
      return NextResponse.json(
        {
          success: false,
          error: '缺少消息内容',
        },
        { status: 400 },
      )
    }

    console.log('简易版接收到的消息:', message || '(空消息，获取开场白)')

    const cozeConfig = getSimpleCozeConfig()
    console.log('简易版 Coze 配置:', {
      apiUrl: cozeConfig.cozeApiUrl,
      hasToken: !!cozeConfig.cozeApiToken,
      tokenLength: cozeConfig.cozeApiToken?.length,
      projectId: cozeConfig.cozeProjectId,
      messageLength: message?.length || 0,
      messageIsEmpty: message?.trim() === '',
    })

    // 检查是否配置了 Token
    if (!cozeConfig.cozeApiToken) {
      console.log('简易版 Coze API Token 未配置，使用模拟响应')
      const mockResponse = generateSimpleMockResponse()
      return NextResponse.json(
        {
          success: true,
          data: {
            message: mockResponse,
          },
          isMock: true,
        },
        { status: 200 },
      )
    }

    // 如果是空消息或问候语,返回固定的开场白
    const messageIsEmpty = message?.trim() === ''
    const isGreeting = ['你好', '您好', 'hi', 'hello'].includes(message?.trim().toLowerCase())

    if (messageIsEmpty || isGreeting) {
      console.log('=== 简易版开场白处理 ===')

      // 简易版的标准开场白
      const welcomeMessage = `欢迎来到牛马测评仪（简易版）！🎯

现在开始第一步：请输入您的**当前年薪**是多少元？（含税，单位：元）

💡 提示：例如一万就输入 10000，这是计算时薪和整体回报的关键基础哦～

准备好后，请直接输入数字即可！`

      return NextResponse.json({
        success: true,
        data: {
          message: welcomeMessage,
        },
        isMock: false,
        timestamp: new Date().toISOString(),
      })
    }

    // 调用简易版 Coze API
    const aiResponse = await callSimpleCozeAPI(message, cozeConfig)

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
      },
      isMock: false,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('简易版 Coze 评估错误:', error)

    const mockResponse = generateSimpleMockResponse()

    return NextResponse.json(
      {
        success: true,
        data: {
          message: mockResponse,
        },
        isMock: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}

// 生成简易版模拟响应
function generateSimpleMockResponse(): string {
  return `感谢您的回答！根据简易版测评，我为您进行以下快速评估：

📊 **快速分析：**
• 您的职场情况已记录
• 建议关注工作与生活的平衡
• 适当调整工作节奏

💡 **简单建议：**
1. 保持积极心态
2. 关注核心价值
3. 合理规划时间

简易版测评完成！如需更详细的分析，请使用正常版测评。✨`
}
