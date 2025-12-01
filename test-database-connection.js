// 测试 Supabase 数据库连接和表结构
const { createClient } = require('@supabase/supabase-js')

// 使用与应用相同的配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'
)

async function testDatabase() {
  console.log('🔍 测试 Supabase 数据库连接...')
  
  try {
    // 测试连接
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1)
    console.log('连接测试结果:', error || 'OK')
  } catch (err) {
    console.log('连接错误:', err.message)
  }

  // 检查表是否存在
  const tables = ['user_profiles', 'conversations', 'messages']
  
  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ 表 ${tableName} 错误:`, error.message)
      } else {
        console.log(`✅ 表 ${tableName} 存在，记录数:`, count)
      }
    } catch (err) {
      console.log(`❌ 表 ${tableName} 检查失败:`, err.message)
    }
  }

  // 测试创建一个对话
  try {
    console.log('\n🔍 测试创建对话...')
    
    // 先尝试获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ 需要登录用户才能测试')
      return
    }

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: '测试对话',
        status: 'active'
      })
      .select()
      .single()

    if (convError) {
      console.log('❌ 创建对话失败:', convError.message)
      console.log('错误详情:', convError)
    } else {
      console.log('✅ 创建对话成功:', conv.id)
      
      // 删除测试对话
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conv.id)
      
      console.log('🧹 已删除测试对话')
    }
  } catch (err) {
    console.log('❌ 测试创建对话失败:', err.message)
  }
}

testDatabase().then(() => {
  console.log('\n🏁 数据库测试完成')
}).catch(err => {
  console.error('测试执行失败:', err)
})