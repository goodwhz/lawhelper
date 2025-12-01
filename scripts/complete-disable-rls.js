const { createClient } = require('@supabase/supabase-js')

// 创建 Supabase 客户端
const supabaseUrl = 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableAllRls() {
  console.log('🔧 开始完全禁用 RLS 策略...')
  
  const tables = [
    'user_profiles',
    'conversations', 
    'messages',
    'law_documents',
    'law_categories',
    'administrative_laws',
    'local_regulations',
    'national_laws'
  ]

  // 测试每个表的访问权限
  console.log('\n📊 测试表访问权限:')
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: 访问正常`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n⚠️  重要提示:')
  console.log('由于安全限制，这个脚本只能测试访问权限，无法直接禁用 RLS 策略。')
  console.log('请按照以下步骤手动禁用 RLS:')
  console.log('\n1. 访问 Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard')
  console.log('\n2. 选择项目: duyfvvbgadrwaonvlrun')
  console.log('\n3. 打开 SQL Editor')
  console.log('\n4. 复制并执行 disable-all-rls.sql 文件中的内容')
  console.log('\n5. 或者手动执行以下命令:')
  
  tables.forEach(table => {
    console.log(`   ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`)
  })
  
  console.log('\n6. 执行完成后重新运行此脚本验证结果')
  
  console.log('\n🔍 快速验证方法:')
  console.log('   启动应用: npm run dev')
  console.log('   访问: http://localhost:3005/ai-chat')
  console.log('   尝试创建对话和发送消息')
}

// 执行禁用 RLS 的函数
disableAllRls().catch(console.error)