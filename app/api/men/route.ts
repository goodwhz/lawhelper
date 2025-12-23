import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// 定义讯飞虚拟人请求和响应类型
interface XunfeiVirtualHumanRequest {
  serviceId: string
  appId: string
  apiKey: string
  apiSecret: string
  virtualHumanId: string
  virtualHumanName: string
  voiceName: string
  voiceVcn: string
  textContent: string
}

interface XunfeiVirtualHumanResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  audioUrl?: string
  videoUrl?: string
}

// 讯飞虚拟人API端点
const XUNFEI_API_BASE_URL = 'https://vms.cn-huadong-1.xf-yun.com'

// 生成讯飞API签名 - 根据官方文档格式
function generateXunfeiSignature(
  apiKey: string,
  apiSecret: string,
  host: string,
  path: string,
  method: string = 'POST'
): { authorization: string; date: string } {
  // 生成RFC1123格式的时间戳
  const now = new Date()
  const dateStr = now.toUTCString()
  
  // 构建签名原始串
  const signatureOrigin = `host: ${host}\ndate: ${dateStr}\n${method} ${path} HTTP/1.1`
  
  // 计算HMAC-SHA256签名
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64')
  
  // 构建authorization原始字符串
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  
  // Base64编码authorization
  const authorization = Buffer.from(authorizationOrigin).toString('base64')
  
  return { authorization, date: dateStr }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: XunfeiVirtualHumanRequest = await request.json()
    
    // 验证必需参数
    if (!body.serviceId || !body.appId || !body.apiKey || !body.apiSecret || !body.textContent) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数'
      }, { status: 400 })
    }

    // 构建讯飞TTS API请求路径和主机（使用通用的语音合成服务）
    const apiHost = 'tts-api.xfyun.cn'
    const apiPath = '/v2/tts'
    
    // 生成认证签名
    const { authorization, date } = generateXunfeiSignature(
      body.apiKey,
      body.apiSecret,
      apiHost,
      apiPath
    )
    
    // 构建请求体 - 根据讯飞虚拟人API官方文档格式
    const requestBody = {
      header: {
        app_id: body.appId,
        uid: "" // 用户ID，可选
      },
      parameter: {
        vmr: {
          stream: {
            protocol: "xrtc" // 使用默认的xrtc协议
          },
          avatar_id: body.virtualHumanId, // 虚拟形象ID
          width: 1280, // 视频宽度
          height: 720  // 视频高度
        }
      }
    }

    const requestBodyString = JSON.stringify(requestBody)
    
    // URL编码参数
    const encodedHost = encodeURIComponent(apiHost)
    const encodedDate = encodeURIComponent(date)
    const encodedAuthorization = encodeURIComponent(authorization)
    
    // 构建完整的API URL（包含认证参数）
    const apiUrl = `${XUNFEI_API_BASE_URL}${apiPath}?host=${encodedHost}&date=${encodedDate}&authorization=${encodedAuthorization}`

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Host': apiHost
    }

    // 调用讯飞虚拟人API
    const externalResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: requestBodyString
    })

    if (!externalResponse.ok) {
      let errorDetails = ''
      try {
        errorDetails = await externalResponse.text()
      } catch (e) {
        errorDetails = '无法读取错误详情'
      }
      
      console.error('讯飞虚拟人API调用失败:', {
        status: externalResponse.status,
        statusText: externalResponse.statusText,
        url: apiUrl,
        headers: Object.fromEntries(externalResponse.headers.entries()),
        errorDetails: errorDetails
      })
      
      return NextResponse.json({
        success: false,
        error: `讯飞API错误: ${externalResponse.status}`,
        details: errorDetails,
        statusText: externalResponse.statusText
      }, { status: externalResponse.status })
    }

    // 解析讯飞API响应
    const externalData = await externalResponse.json()
    
    // 处理响应数据
    let audioUrl = ''
    let videoUrl = ''
    
    if (externalData.data && externalData.data.audio) {
      // 这里需要根据实际响应格式提取音频URL
      audioUrl = `data:audio/wav;base64,${externalData.data.audio}`
    }
    
    if (externalData.data && externalData.data.video) {
      // 这里需要根据实际响应格式提取视频URL
      videoUrl = externalData.data.video
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: externalData,
      message: '讯飞虚拟人接口调用成功',
      audioUrl: audioUrl,
      videoUrl: videoUrl
    })

  } catch (error) {
    console.error('讯飞虚拟人API处理错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 添加OPTIONS方法处理CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}