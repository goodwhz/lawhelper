import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Coze Chat API 开始处理 ===')

    const body = await request.json()
    console.log('接收到的请求体:', body)

    const { disputeType, description } = body

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

    // 从环境变量获取 Coze 配置
    const cozeApiUrl = process.env.COZE_API_URL || 'https://x6yjs8hc3k.coze.site/stream_run'
    const cozeApiToken = process.env.COZE_API_TOKEN
    const cozeProjectId = process.env.COZE_PROJECT_ID || '7589147310182039571'

    console.log('Coze 配置:', {
      apiUrl: cozeApiUrl,
      hasToken: !!cozeApiToken,
      tokenLength: cozeApiToken?.length,
      projectId: cozeProjectId,
    })

    // 如果没有配置 Token,返回模拟响应
    if (!cozeApiToken || cozeApiToken === '<YOUR_TOKEN>') {
      console.log('Coze API Token 未配置,返回模拟响应')
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
      project_id: parseInt(cozeProjectId),
    }

    console.log('发送到 Coze 的请求:', JSON.stringify(requestBody, null, 2))

    // 调用 Coze API
    console.log('开始调用 Coze API...')

    // 设置超时控制（Vercel 最大 60 秒）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000) // 55 秒超时

    let cozeResponse
    try {
      cozeResponse = await fetch(cozeApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cozeApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Coze API 请求失败:', fetchError)
      // 如果请求超时或失败，返回模拟响应
      const mockResponse = generateMockResponse(disputeType, description)
      return NextResponse.json({
        success: true,
        data: {
          analysis: {
            summary: mockResponse,
            raw: { mock: true, error: fetchError.message },
          },
        },
        timestamp: new Date().toISOString(),
      })
    }

    console.log('Coze API 响应状态:', {
      ok: cozeResponse.ok,
      status: cozeResponse.status,
      statusText: cozeResponse.statusText,
    })

    if (!cozeResponse.ok) {
      const errorText = await cozeResponse.text()
      console.error('Coze API 错误详情:', errorText)

      // 如果 API 调用失败，返回模拟响应而不是错误
      console.log('API 调用失败，返回模拟响应')
      const mockResponse = generateMockResponse(disputeType, description)
      return NextResponse.json({
        success: true,
        data: {
          analysis: {
            summary: mockResponse,
            raw: { mock: true, error: errorText },
          },
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 处理流式响应 (Server-Sent Events)
    const responseText = await cozeResponse.text()
    console.log('Coze API 流式响应长度:', responseText.length)

    // 解析流式响应,提取答案
    let aiResponse = ''
    const lines = responseText.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6))
          // 提取 answer 字段的内容
          if (data.content && data.content.answer) {
            aiResponse += data.content.answer
          }
        } catch (e) {
          // 忽略解析错误的行
        }
      }
    }

    console.log('提取的 AI 响应长度:', aiResponse.length)
    console.log('AI 响应前200字:', aiResponse.substring(0, 200))

    // 如果没有提取到内容,返回模拟响应
    if (!aiResponse.trim()) {
      console.log('未能从流式响应中提取内容,使用模拟响应')
      aiResponse = generateMockResponse(disputeType, description)
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          summary: aiResponse,
          raw: responseText,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Coze 评估错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Coze API 调用出错',
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// 生成模拟响应(用于 Token 无效或 API 调用失败时)
function generateMockResponse(disputeType: string, description: string): string {
  const responses = {
    工资争议: `
根据您提供的工资争议情况,我为您提供以下分析和建议:

📋 **问题分析:**
• 工资拖欠属于严重的劳动违法行为
• 根据《劳动法》第50条,工资应当按月足额支付给劳动者本人

⚖️ **法律依据:**
• 《劳动合同法》第85条:未及时足额支付劳动报酬的,用人单位应当支付赔偿金
• 可要求支付工资100%-200%的赔偿金

✅ **建议步骤:**
1. **收集证据** - 工资条、银行流水、劳动合同、工作证明
2. **沟通协商** - 与HR或财务部门书面沟通,要求补发工资
3. **劳动监察** - 向当地劳动监察大队投诉(举报电话:12333)
4. **劳动仲裁** - 申请劳动仲裁,要求支付工资和赔偿金
5. **法律诉讼** - 仲裁不服可向法院起诉

⏰ **重要提示:**
• 劳动争议仲裁时效为1年
• 建议优先通过劳动监察解决,效率较高
• 保留所有证据材料是维权成功的关键
`,

    解除合同: `
根据您提到的解除合同争议,以下是法律分析:

📋 **问题分析:**
• 用人单位解除劳动合同需要符合法定条件
• 需要支付经济补偿金或赔偿金

⚖️ **法律依据:**
• 《劳动合同法》第47条:经济补偿按工作年限,每年1个月工资
• 第87条:违法解除需支付2倍赔偿金

✅ **建议步骤:**
1. **确认解除理由** - 查看解除通知书,了解解除原因
2. **审查合法性** - 判断解除是否符合法律规定
3. **协商解决** - 要求支付法定补偿或赔偿
4. **劳动仲裁** - 申请仲裁维护权益
5. **法律援助** - 复杂案件可申请法律援助

⏰ **重要提示:**
• N+1补偿:标准经济补偿
• 2N赔偿:违法解除的赔偿
• 及时行动,不要错过时效
`,

    加班费: `
针对加班费争议,为您提供专业建议:

📋 **问题分析:**
• 加班费应当按法律标准支付
• 不支付加班费属于违法行为

⚖️ **法律依据:**
• 《劳动法》第44条:加班费支付标准
• 工作日:150%;休息日:200%;法定假日:300%

✅ **建议步骤:**
1. **收集加班证据** - 考勤记录、工作邮件、加班通知
2. **计算应得加班费** - 按法律规定标准计算
3. **书面沟通** - 要求用人单位支付加班费
4. **劳动仲裁** - 申请仲裁维护权益

⏰ **重要提示:**
• 保留加班证据是关键
• 计算清楚应得金额
• 可要求支付额外的赔偿金
`,

    default: `
根据您描述的争议情况,我为您提供以下建议:

📋 **情况分析:**
• 您遇到了劳动纠纷问题
• 需要通过合法途径维护自身权益

✅ **一般建议步骤:**
1. **收集证据** - 保存所有相关文件和记录
2. **沟通协商** - 尝试通过沟通解决问题
3. **寻求调解** - 向劳动部门申请调解
4. **劳动仲裁** - 向劳动仲裁委员会申请仲裁
5. **法律诉讼** - 仲裁不服可向法院起诉

💡 **重要提示:**
• 劳动争议仲裁时效为1年
• 证据收集非常重要
• 复杂案件建议咨询专业律师
• 保持冷静和理性,依法维权
`,
  }

  return responses[disputeType as keyof typeof responses] || responses.default
}
