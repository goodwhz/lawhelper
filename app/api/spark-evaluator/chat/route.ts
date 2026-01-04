import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Coze API 配置
const COZE_API_URL = 'https://qz6hgwr9c2.coze.site/stream_run'
const COZE_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEzZGVmNTgyLWE1MGQtNDQ4OC04MmY1LTQ5N2I3N2JjMGRhYiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkVZdE5SRm9vRkl0bXR2SjBOT0hlbGQxdXRjSFJOeFBWIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3MTcxMTI0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5OTM0NDk0ODIwMzM1NjM1Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTg5OTQyMTg3ODgyNzA5MDI2In0.EeA18D3oK-Fqeo6pyjLIA-KIg2Og0yQavxImY058fyVLrsU-3BSmeXOpW9cPM3ex61Af27sCiFp_lZZQGKlPeoxGcx_RB6JtSUZK0vrKEllXpiTIn8ZMCa84BjhJE5jp044aepimB58OAnNTTd3eZvAA6guM2CilSXB74lCzE3WjZGqmsH_muWjQzl9m12ZYLlRxKfWnio47i4VFqciZO0d-dj_F0qkoT1r-YwI8N7owz8vnaQ_-SnekXVpjUnYidCz1nNz03BH4GhCOMU7ln1Hj6YlkIb-omlB9gHMoR6YviF5ItkOZ5-W6bz_r48j8Q37SEGoHaC0ydLbov-W2xw'
const COZE_PROJECT_ID = '7589925531894808617'

// 调用 Coze API
async function callCozeAPI(message: string): Promise<string> {
  try {
    console.log('调用 Coze API...')

    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
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
        project_id: Number.parseInt(COZE_PROJECT_ID, 10),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Coze API 错误:', response.status, errorText)
      throw new Error(`Coze API 错误: ${response.status} ${errorText}`)
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
      // Coze 返回的是 SSE 格式，每行以 "data: " 开头
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            continue
          }
          try {
            const parsed = JSON.parse(data)
            // 根据实际响应结构提取内容
            if (parsed.content || parsed.message || parsed.answer) {
              fullResponse += parsed.content || parsed.message || parsed.answer || ''
            }
          } catch (e) {
            // 忽略解析错误
            console.warn('解析 SSE 数据失败:', e)
          }
        }
      }
    }

    console.log('Coze API 响应成功,响应长度:', fullResponse.length)
    return fullResponse || '抱歉，没有收到响应。'
  } catch (error) {
    console.error('调用 Coze API 失败:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Coze Chat API 开始处理 ===')

    const body = await request.json()
    console.log('接收到的请求体:', body)

    const { message } = body

    if (!message) {
      console.log('参数验证失败: 缺少消息内容')
      return NextResponse.json(
        {
          success: false,
          error: '缺少消息内容',
        },
        { status: 400 },
      )
    }

    // 调用 Coze API
    const aiResponse = await callCozeAPI(message)

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Coze 评估错误:', error)

    // 返回模拟响应作为降级方案
    const mockResponse = generateMockResponse()

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
}

// 生成模拟响应(用于 API 调用失败时)
function generateMockResponse(): string {
  return `感谢您的描述！根据您提供的情况，我为您进行以下职场处境评估：

📊 **处境分析：**
• 您目前的职场状态确实存在一些挑战
• 建议您客观看待当前困境，不要过于自责
• 适当的压力是正常的，但要注意调节

💡 **改善建议：**
1. **明确目标** - 思考您真正想要的职业发展方向
2. **提升技能** - 利用业余时间学习新技能，增强竞争力
3. **建立边界** - 学会合理拒绝不合理的工作要求
4. **寻求支持** - 与同事、朋友或专业人士交流
5. **保持健康** - 注意工作与生活的平衡

⚠️ **重要提醒：**
• 职场困境是暂时的，不要轻易放弃
• 评估结果仅供参考，请结合自身情况做决定
• 必要时可以寻求职业咨询或心理支持

加油！您一定能找到属于自己的职业道路！💪`
}
