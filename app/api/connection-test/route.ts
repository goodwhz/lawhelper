import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    server: {
      status: 'ok',
      node_version: process.version,
      next_version: '15.5.6'
    },
    database: { status: 'unknown', error: null },
    environment: { status: 'unknown', error: null },
    dify: { status: 'unknown', error: null }
  }

  // 测试数据库连接
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)
    
    if (error) {
      testResults.database = {
        status: 'error',
        error: error.message
      }
    } else {
      testResults.database = {
        status: 'ok',
        data: `找到 ${data?.length || 0} 条记录`
      }
    }
  } catch (error) {
    testResults.database = {
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }

  // 测试环境变量
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_KEY',
      'NEXT_PUBLIC_API_URL'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      testResults.environment = {
        status: 'error',
        error: `缺少环境变量: ${missingVars.join(', ')}`
      }
    } else {
      testResults.environment = {
        status: 'ok',
        data: '所有必需的环境变量都已设置'
      }
    }
  } catch (error) {
    testResults.environment = {
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }

  // 测试Dify连接
  try {
    const difyUrl = process.env.NEXT_PUBLIC_API_URL
    const difyKey = process.env.NEXT_PUBLIC_APP_KEY
    
    if (!difyUrl || !difyKey) {
      testResults.dify = {
        status: 'error',
        error: '缺少Dify配置'
      }
    } else {
      const response = await fetch(`${difyUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${difyKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {},
          query: 'connection test',
          response_mode: 'blocking',
          user: 'test'
        })
      }).catch(() => null)

      if (response && response.ok) {
        testResults.dify = {
          status: 'ok',
          data: 'Dify API连接正常'
        }
      } else {
        testResults.dify = {
          status: 'error',
          error: response ? `HTTP ${response.status}` : '网络连接失败'
        }
      }
    }
  } catch (error) {
    testResults.dify = {
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }

  return NextResponse.json(testResults)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('收到前端请求:', body)
    
    return NextResponse.json({
      status: 'ok',
      message: '前后端连接正常',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('处理POST请求失败:', error)
    return NextResponse.json({
      status: 'error',
      message: '请求处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 400 })
  }
}