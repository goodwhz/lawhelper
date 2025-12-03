import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

// 调试认证状态的API端点
export async function GET(request: NextRequest) {
  try {
    console.log('=== 开始调试认证状态 ===')
    
    // 检查环境变量
    const envCheck = {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
      SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
    }
    
    console.log('环境变量状态:', envCheck)
    
    // 尝试获取当前用户
    const userResult = await getCurrentUser()
    console.log('当前用户结果:', {
      hasUser: !!userResult,
      isAdmin: userResult?.isAdmin,
      userEmail: userResult?.user?.email
    })
    
    // 检查session状态
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session状态:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      sessionError: sessionError?.message
    })
    
    // 检查用户资料
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      console.log('用户资料状态:', {
        hasProfile: !!profile,
        profileRole: profile?.role,
        profileError: profileError?.message
      })
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      auth: {
        currentUser: {
          hasUser: !!userResult,
          userId: userResult?.user?.id,
          userEmail: userResult?.user?.email,
          isAdmin: userResult?.isAdmin
        },
        session: {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        },
        profile: session?.user ? {
          hasProfile: !!session?.user,
          profileData: null // 出于安全考虑不返回完整资料
        } : null
      },
      errors: {
        sessionError: sessionError?.message,
        userError: null
      }
    })
    
  } catch (error) {
    console.error('调试认证状态失败:', error)
    return NextResponse.json({
      error: '调试失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}