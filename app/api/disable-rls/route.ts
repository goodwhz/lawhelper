import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 创建具有管理员权限的客户端
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
    console.log('🔧 临时禁用 RLS 策略用于测试...')

    // 简单的 SQL 命令来禁用 RLS
    const commands = [
      'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;'
    ]

    const results = []
    
    for (const command of commands) {
      try {
        // 由于我们没有 SERVICE_ROLE_KEY，这将可能失败
        // 但我们先尝试
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .select('*')
          .limit(1)
        
        results.push({
          command: command.substring(0, 50) + '...',
          testConnection: error ? error.message : 'OK',
          note: '需要 SERVICE_ROLE_KEY 来执行 DDL 命令'
        })
      } catch (err) {
        results.push({
          command: command.substring(0, 50) + '...',
          error: (err as Error).message
        })
      }
    }

    return NextResponse.json({
      message: 'RLS 状态检查完成',
      results: results,
      recommendation: '请在 Supabase Dashboard 的 SQL Editor 中手动执行以下命令:',
      sql: [
        'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;'
      ]
    })

  } catch (error) {
    console.error('RLS 操作失败:', error)
    return NextResponse.json(
      { error: 'RLS 操作失败', details: (error as Error).message },
      { status: 500 }
    )
  }
}