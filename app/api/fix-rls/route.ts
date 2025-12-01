import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 使用 service role key（如果可用）或者创建管理员客户端
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST() {
  try {
    console.log('🔧 开始修复 RLS 策略...')

    // SQL 命令列表
    const sqlCommands = [
      // 1. 禁用 RLS 进行测试
      'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;',
      
      // 2. 删除现有策略
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;',
      'DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;',
      'DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;',
      'DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;',
      'DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;',
      'DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;',
      'DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;',
      'DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;',
      'DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;',
      'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;',
      
      // 3. 重新启用 RLS
      'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;',
      
      // 4. 创建新的 RLS 策略
      `CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);`,
      
      `CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);`,
      
      `CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);`,
      
      `CREATE POLICY "Users can view own conversations" ON public.conversations
        FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can create own conversations" ON public.conversations
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update own conversations" ON public.conversations
        FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can delete own conversations" ON public.conversations
        FOR DELETE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can view own messages" ON public.messages
        FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can create own messages" ON public.messages
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update own messages" ON public.messages
        FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can delete own messages" ON public.messages
        FOR DELETE USING (auth.uid() = user_id);`
    ]

    const results = []
    
    // 逐个执行 SQL 命令
    for (const sql of sqlCommands) {
      try {
        console.log('执行 SQL:', sql.substring(0, 100) + '...')
        
        // 使用 RPC 调用来执行 SQL（如果可用）
        // 或者直接使用 SQL 如果有服务角色权限
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_command: sql })
        
        if (error) {
          console.log('SQL 执行失败，尝试其他方法:', error.message)
          results.push({ sql: sql.substring(0, 50) + '...', error: error.message })
        } else {
          results.push({ sql: sql.substring(0, 50) + '...', success: true })
        }
      } catch (err) {
        console.log('SQL 执行异常:', err)
        results.push({ sql: sql.substring(0, 50) + '...', error: (err as Error).message })
      }
    }

    return NextResponse.json({
      message: 'RLS 策略修复完成',
      results: results,
      note: '如果某些命令执行失败，请在 Supabase Dashboard 的 SQL Editor 中手动执行 fix-rls.sql 中的命令'
    })

  } catch (error) {
    console.error('RLS 修复失败:', error)
    return NextResponse.json(
      { error: 'RLS 策略修复失败', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '请发送 POST 请求来修复 RLS 策略',
    instructions: [
      '1. 在浏览器中访问 http://localhost:3005/api/fix-rls',
      '2. 或者手动在 Supabase Dashboard 的 SQL Editor 中执行 fix-rls.sql 文件中的命令',
      '3. 如果仍有问题，请检查 SUPABASE_SERVICE_ROLE_KEY 环境变量是否设置'
    ]
  })
}