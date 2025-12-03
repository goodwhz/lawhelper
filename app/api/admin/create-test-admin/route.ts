import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 创建测试管理员账号的API端点（仅用于开发和测试）
export async function POST() {
  try {
    const testAdminEmail = 'admin@test.com'
    const testAdminPassword = 'admin123456'
    
    // 尝试创建测试管理员账号
    const { data, error } = await supabase.auth.signUp({
      email: testAdminEmail,
      password: testAdminPassword,
      options: {
        data: {
          name: '测试管理员',
        },
      },
    })
    
    if (error) {
      // 如果用户已存在，尝试获取用户信息
      if (error.message.includes('already registered')) {
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email: testAdminEmail,
          password: testAdminPassword,
        })
        
        if (existingUser.user) {
          // 更新用户资料为管理员
          await supabase
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.user.id)
            
          return NextResponse.json({
            success: true,
            message: '测试管理员账号已存在并设置为管理员',
            email: testAdminEmail,
            userId: existingUser.user.id
          })
        }
      }
      
      throw error
    }
    
    if (data.user) {
      // 新用户创建成功，设置为管理员
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id)
        
      if (profileError) {
        console.warn('设置管理员角色失败:', profileError)
      }
      
      return NextResponse.json({
        success: true,
        message: '测试管理员账号创建成功',
        email: testAdminEmail,
        password: testAdminPassword,
        userId: data.user.id,
        note: '请使用此账号登录测试管理员功能'
      })
    }
    
    throw new Error('创建用户失败')
    
  } catch (error) {
    console.error('创建测试管理员失败:', error)
    return NextResponse.json({ 
      error: '创建测试管理员失败', 
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}