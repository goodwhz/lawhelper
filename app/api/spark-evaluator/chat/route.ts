import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import WebSocket from 'ws'

// 讯飞星辰 API 配置
const SPARK_API_URL = 'wss://spark-openapi.cn-huabei-1.xf-yun.com/v1/assistants/c6lviwhk2sfk_v1'
const SPARK_API_SECRET = 'YTVlMTJmNTliYTM4MmQwOGM0ZTQzMzVi'
const SPARK_APP_ID = 'b20ae552'

// 生成 JWT Token (用于讯飞API鉴权)
function generateSparkToken(): string {
  // 获取当前时间戳和过期时间
  const now = Date.now()
  const expiration = now + 3600000 // 1小时后过期

  const payload = {
    uid: `user_${now.toString()}`,
    exp: expiration,
    iat: now,
  }

  // 使用 API Secret 作为密钥
  const token = jwt.sign(payload, SPARK_API_SECRET, { algorithm: 'HS256' })
  return token
}

// WebSocket 通信函数
function callSparkWebSocket(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 生成鉴权 Token
    try {
      const token = generateSparkToken()

      // 构建连接 URL
      const url = `${SPARK_API_URL}?Authorization=${encodeURIComponent(`Bearer ${token}`)}`

      console.log('连接讯飞星辰 API...')
      const ws = new WebSocket(url)

      let fullResponse = ''
      let isConnected = false

      ws.on('open', () => {
        console.log('WebSocket 连接已建立')
        isConnected = true

        // 发送消息
        ws.send(JSON.stringify({
          header: {
            app_id: SPARK_APP_ID,
            uid: `user_${Date.now().toString()}`,
          },
          parameter: {
            chat: {
              domain: 'general',
              temperature: 0.7,
              max_tokens: 2048,
            },
          },
          payload: {
            message: {
              text: [
                {
                  role: 'user',
                  content: message,
                },
              ],
            },
          },
        }))
      })

      ws.on('message', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString())

          // 处理不同的消息类型
          if (response.header && response.header.code === 0) {
            // 成功响应
            if (response.payload && response.payload.choices) {
              const choices = response.payload.choices
              if (choices.text && choices.text.length > 0) {
                const content = choices.text[0].content
                fullResponse += content
              }

              // 检查是否完成
              if (choices.status === 2) {
                ws.close()
                resolve(fullResponse)
              }
            }
          } else if (response.header && response.header.code !== 0) {
            // 错误响应
            console.error('讯飞API错误:', response.header)
            ws.close()
            reject(new Error(`讯飞API错误: ${response.header.message || '未知错误'}`))
          }
        } catch (error) {
          console.error('解析消息失败:', error)
        }
      })

      ws.on('error', (error: Error) => {
        console.error('WebSocket 错误:', error)
        reject(error)
      })

      ws.on('close', () => {
        console.log('WebSocket 连接已关闭')
        if (!isConnected) {
          reject(new Error('无法连接到讯飞API'))
        } else if (fullResponse) {
          resolve(fullResponse)
        }
      })

      // 设置超时
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
          reject(new Error('请求超时'))
        }
      }, 30000)
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 讯飞星辰 Chat API 开始处理 ===')

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

    console.log('调用讯飞星辰 API...')

    // 调用讯飞API
    const aiResponse = await callSparkWebSocket(message)

    console.log('讯飞API 响应成功,响应长度:', aiResponse.length)

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('讯飞评估错误:', error)

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
