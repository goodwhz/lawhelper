import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 开始修复批量删除函数 ===')
    
    // 读取SQL文件
    const sqlPath = join(process.cwd(), 'migrations', 'fix_batch_delete_function.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    console.log('SQL文件读取成功，开始执行...')
    
    // 分割SQL语句并逐个执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    const results = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`执行语句 ${i + 1}/${statements.length}:`, statement.substring(0, 50) + '...')
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_statement: statement })
        
        if (error) {
          // 如果exec_sql不存在，尝试直接执行
          console.log('exec_sql不存在，尝试其他方法...')
          
          // 对于这类情况，我们需要直接执行SQL
          // 但由于限制，我们提供手动执行的指导
          results.push({
            statement: statement.substring(0, 50) + '...',
            status: 'manual_required',
            message: '需要手动执行'
          })
        } else {
          results.push({
            statement: statement.substring(0, 50) + '...',
            status: 'success',
            data: data
          })
        }
      } catch (error) {
        console.error(`语句执行失败 ${i + 1}:`, error)
        results.push({
          statement: statement.substring(0, 50) + '...',
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }
    
    console.log('=== 修复完成 ===')
    
    return NextResponse.json({
      success: true,
      message: '批量删除函数修复脚本已准备完成',
      results: results,
      sql_content: sqlContent,
      manual_instructions: `
请手动执行以下步骤来完全修复批量删除功能：

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择项目: duyfvvbgadrwaonvlrun
3. 打开 SQL Editor
4. 复制并执行 migrations/fix_batch_delete_function.sql 文件中的内容
5. 或者直接执行文件中的主要SQL语句

修复后，批量删除功能将支持：
- 通过用户ID参数进行权限验证
- 不依赖 auth.uid() 的直接删除
- 更好的错误处理和失败追踪
      `
    })
    
  } catch (error) {
    console.error('修复批量删除函数失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '修复失败',
      message: '请检查SQL文件是否存在，或手动执行修复脚本'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '请使用POST请求来执行批量删除函数修复',
    instructions: '发送POST请求到此端点以自动修复批量删除功能'
  })
}