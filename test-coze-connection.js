// 测试 Coze API 连接
const COZE_API_URL = 'https://x6yjs8hc3k.coze.site/stream_run'
const COZE_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU4OWU3ZjlkLWQ5YzQtNDkzNi1iZGQzLTI2YWU2OGNhZDMzMiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkREdzJSeVRvemxCY25KZTFGc25pY0RXOExNVndZNE1MIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3MDYyNDUxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTg5MTU5MzczNTM3MDE3ODk3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTg5NDc1NDM4MzkzNTU3MDU1In0.ZXC-11L9Ezej3voKDBtg5C8RKtr2v2gAmsFUB0iLd_8Xq1mKdv259lbroWe8t23_WcST2ZwcepEszEzoKmqaiDYwI_xkMnYEpBeHrRz5IRb32xA9r8Wls6ZgZcUcWjlTq2ucEEEIEYOqiqWIzPzHfmpGzbZqCPqv4ZcRpKLlF76UeKEkf9d-uMo6AN_Ab-lBKdIygA-1BTnFmvIjl8o9AbUVCqt9Fw5gzmOnGk4wfhQ8M7Wz4pMnF1pRIhtjIJ_q4Bn4ckpeXPAfEXa593eYO87ticUCSBQLIkCtJ4VtsHXw1NKiDWzsnrMqEac8mdgRdf7vYers0bzI56P6VM-zeg'
const COZE_PROJECT_ID = '7589147310182039571'

console.log('=== Coze API 连接测试 ===')
console.log('API URL:', COZE_API_URL)
console.log('Project ID:', COZE_PROJECT_ID)

// 解析 Token
const parts = COZE_API_TOKEN.split('.')
if (parts.length === 3) {
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

    console.log('\n=== Token 信息 ===')
    console.log('Header:', JSON.stringify(header, null, 2))
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('签发时间 (iat):', new Date(payload.iat * 1000).toISOString())
    console.log('过期时间 (exp):', new Date(payload.exp * 1000).toISOString())
    console.log('当前时间:', new Date().toISOString())

    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < currentTime
    console.log('Token 是否已过期:', isExpired)
  } catch (e) {
    console.error('解析 Token 失败:', e.message)
  }
} else {
  console.log('Token 格式错误')
}

// 测试 API 调用
async function testCozeAPI() {
  console.log('\n=== 测试 API 调用 ===')

  const requestBody = {
    content: {
      query: {
        prompt: [
          {
            type: 'text',
            content: {
              text: '测试消息',
            },
          },
        ],
      },
    },
    type: 'query',
    project_id: parseInt(COZE_PROJECT_ID),
  }

  console.log('请求体:', JSON.stringify(requestBody, null, 2))

  try {
    const startTime = Date.now()
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    const endTime = Date.now()

    console.log('\n=== API 响应 ===')
    console.log('状态码:', response.status)
    console.log('状态文本:', response.statusText)
    console.log('响应时间:', `${endTime - startTime}ms`)
    console.log('响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('错误响应:', errorText)
      return
    }

    const responseText = await response.text()
    console.log('响应长度:', responseText.length)
    console.log('响应内容前500字符:', responseText.substring(0, 500))

    // 解析流式响应
    let aiResponse = ''
    const lines = responseText.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6))
          if (data.content && data.content.answer) {
            aiResponse += data.content.answer
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    console.log('\n=== 提取的 AI 响应 ===')
    if (aiResponse.trim()) {
      console.log('AI 响应长度:', aiResponse.length)
      console.log('AI 响应内容:', aiResponse)
    } else {
      console.log('未能提取到 AI 响应内容')
      console.log('原始响应:', responseText)
    }
  } catch (error) {
    console.error('\n=== API 调用失败 ===')
    console.error('错误:', error.message)
    console.error('堆栈:', error.stack)
  }
}

testCozeAPI()
