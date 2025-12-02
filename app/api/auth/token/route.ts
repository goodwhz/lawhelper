import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // 从请求头中获取token
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未找到认证令牌' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // 验证token并获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name
      }
    })

  } catch (error) {
    console.error('获取用户token失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}