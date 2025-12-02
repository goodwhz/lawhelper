import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== 测试服务角色密钥 ===')

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('SUPABASE_URL:', SUPABASE_URL ? '已配置' : '未配置')
    console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '已配置' : '未配置')
    console.log('SERVICE_ROLE_KEY长度:', SERVICE_ROLE_KEY?.length || 0)

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: '环境变量配置不完整',
        config: {
          url: !!SUPABASE_URL,
          key: !!SERVICE_ROLE_KEY,
        },
      })
    }

    // 测试API访问
    const testUrl = `${SUPABASE_URL}/auth/v1/admin/users`
    console.log('测试API访问:', testUrl)

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    })

    console.log('API测试响应:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: 'API访问失败',
        status: response.status,
        details: errorText,
      })
    }

    const users = await response.json()

    return NextResponse.json({
      success: true,
      message: '服务角色密钥正常工作',
      userCount: users.users?.length || 0,
      sampleUsers: users.users?.slice(0, 3).map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })) || [],
    })
  } catch (error: any) {
    console.error('测试异常:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
