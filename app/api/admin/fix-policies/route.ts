import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 修复管理员权限策略的API端点
export async function POST() {
  try {
    // 检查当前用户是否为管理员
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 检查用户是否为管理员
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 执行策略修复SQL
    const fixPoliciesSQL = `
      -- 删除现有的管理员策略（如果存在）
      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

      -- 创建更完整的管理员策略
      CREATE POLICY "Admins can view all profiles" ON public.user_profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can update all profiles" ON public.user_profiles
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can delete all profiles" ON public.user_profiles
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      -- 对话表管理员策略
      CREATE POLICY "Admins can view all conversations" ON public.conversations
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can update all conversations" ON public.conversations
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can delete all conversations" ON public.conversations
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      -- 消息表管理员策略
      CREATE POLICY "Admins can view all messages" ON public.messages
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can update all messages" ON public.messages
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can delete all messages" ON public.messages
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );
    `

    // 使用 service role 执行 SQL（如果可用）
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: fixPoliciesSQL })

    if (error) {
      console.error('修复策略失败:', error)
      return NextResponse.json({ 
        error: '修复策略失败', 
        details: error.message,
        suggestion: '请在 Supabase 控制台中手动执行修复策略'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '管理员权限策略修复成功'
    })

  } catch (error) {
    console.error('修复策略异常:', error)
    return NextResponse.json({ 
      error: '修复策略异常', 
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}