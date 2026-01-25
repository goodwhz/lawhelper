import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * 应用 Coze 相关数据库迁移
 * POST /api/coze/setup
 */
export async function POST(request: NextRequest) {
  try {
    // 初始化 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 读取 SQL 迁移文件
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', 'create_coze_tables.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    // 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // 如果 exec_sql 不存在，直接执行 SQL
      console.log('exec_sql 不存在，尝试直接执行 SQL...')

      // 将 SQL 分割成多个语句
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      const errors: string[] = []

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('sql', { query: statement })
          if (stmtError) {
            // 尝试使用 REST API
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                },
                body: JSON.stringify({ sql: statement }),
              },
            )

            if (!response.ok) {
              errors.push(`${statement.substring(0, 50)}...: ${await response.text()}`)
            }
          }
        } catch (e: any) {
          errors.push(`${statement.substring(0, 50)}...: ${e.message}`)
        }
      }

      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: '部分 SQL 执行失败',
            errors,
          },
          { status: 500 },
        )
      }
    }

    // 验证表是否创建成功
    const { data: tables, error: tablesError } = await supabase
      .from('coze_sessions')
      .select('id')
      .limit(1)

    if (tablesError) {
      return NextResponse.json(
        {
          success: false,
          message: '表创建验证失败',
          error: tablesError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Coze 数据库表创建成功',
      tables: ['coze_sessions', 'coze_messages', 'coze_connection_logs'],
      views: ['coze_session_stats', 'active_coze_sessions'],
      functions: ['cleanup_expired_coze_sessions', 'cleanup_old_coze_messages'],
    })
  } catch (error: any) {
    console.error('Coze 数据库设置错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: '数据库设置失败',
        error: error.message,
      },
      { status: 500 },
    )
  }
}

/**
 * 检查 Coze 数据库表状态
 * GET /api/coze/setup
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 检查表是否存在
    const { data: sessions, error: sessionsError } = await supabase
      .from('coze_sessions')
      .select('count', { count: 'exact', head: true })

    // 获取统计信息
    const { data: stats, error: statsError } = await supabase
      .from('coze_sessions')
      .select('status')
      .then(({ data, error }) => {
        if (error) { return { data: null, error } }
        const stats = data?.reduce((acc: any, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1
          return acc
        }, {})
        return { data: stats, error: null }
      })

    return NextResponse.json({
      success: true,
      status: {
        tablesExist: !sessionsError,
        sessionCount: sessions || 0,
        sessionStats: stats,
      },
    })
  } catch (error: any) {
    console.error('检查 Coze 数据库状态错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: '检查数据库状态失败',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
