import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔧 提供禁用 RLS 的指导信息...')

    return NextResponse.json({
      message: 'RLS 禁用指导',
      instructions: [
        '请按照以下步骤在 Supabase Dashboard 中禁用 RLS 策略:',
        '',
        '1. 访问 https://supabase.com/dashboard',
        '2. 登录并选择项目 duyfvvbgadrwaonvlrun',
        '3. 在左侧菜单中选择 "SQL Editor"',
        '4. 点击 "New query" 创建新的查询',
        '5. 复制并执行 quick-rls-fix.sql 文件中的内容',
        '',
        '或者直接执行以下关键命令:',
        'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;', 
        'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.law_documents DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.law_categories DISABLE ROW LEVEL SECURITY;',
        '',
        '执行完成后，您的应用将能够正常读写数据库内容。'
      ],
      sqlFile: 'quick-rls-fix.sql',
      verificationUrl: '/api/test-database-access'
    })

  } catch (error) {
    console.error('RLS 指导失败:', error)
    return NextResponse.json(
      { error: 'RLS 指导失败', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RLS 禁用 API',
    usage: '发送 POST 请求来获取禁用 RLS 的详细指导',
    status: 'ready'
  })
}