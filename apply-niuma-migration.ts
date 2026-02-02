/**
 * 应用牛马测评仪数据库迁移
 * 使用方法：npx ts-node apply-niuma-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// 从环境变量或 .env 文件读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  try {
    console.log('=== 开始应用牛马测评仪数据库迁移 ===')

    // 读取迁移 SQL 文件
    const migrationSQL = readFileSync('./migrations/create_niuma_tables.sql', 'utf-8')

    // 执行迁移（注意：需要使用 service_role key 执行 DDL）
    // 这里我们使用 supabase.rpc() 执行，但更好的方式是在 Supabase 控制台中手动执行

    console.log('迁移 SQL 内容：')
    console.log(migrationSQL)
    console.log('\n')

    console.log('请按以下步骤应用迁移：')
    console.log('1. 打开 Supabase 控制台：https://supabase.com/dashboard/project/your-project-id/sql')
    console.log('2. 复制 migrations/create_niuma_tables.sql 中的内容')
    console.log('3. 在 SQL 编辑器中粘贴并执行')
    console.log('4. 确认所有表、索引、策略和触发器都创建成功')
    console.log('\n')

    // 测试连接
    const { data: _data, error } = await supabase
      .from('niuma_evaluations')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      console.log('✅ 数据库表还未创建（这是正常的，请按上述步骤手动应用迁移）')
    } else if (error) {
      console.error('❌ 数据库错误：', error)
    } else {
      console.log('✅ 数据库连接成功，表已存在')
    }
  } catch (error) {
    console.error('❌ 迁移应用失败：', error)
    process.exit(1)
  }
}

applyMigration()
