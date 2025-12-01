const { createClient } = require('@supabase/supabase-js')

// 创建 Supabase 客户端
const supabaseUrl = 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullDatabaseAccess() {
  console.log('🧪 完整数据库访问测试\n')
  
  let allTestsPassed = true

  // 测试1: 读取用户配置表
  console.log('📋 测试1: 读取用户配置表')
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 失败:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ 成功 - 找到', data.length, '个用户配置')
    }
  } catch (err) {
    console.log('❌ 异常:', err.message)
    allTestsPassed = false
  }

  // 测试2: 读取对话表
  console.log('\n💬 测试2: 读取对话表')
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 失败:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ 成功 - 找到', data.length, '个对话')
    }
  } catch (err) {
    console.log('❌ 异常:', err.message)
    allTestsPassed = false
  }

  // 测试3: 读取消息表
  console.log('\n📨 测试3: 读取消息表')
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 失败:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ 成功 - 找到', data.length, '条消息')
    }
  } catch (err) {
    console.log('❌ 异常:', err.message)
    allTestsPassed = false
  }

  // 测试4: 读取法律文档表
  console.log('\n📚 测试4: 读取法律文档表')
  try {
    const { data, error } = await supabase
      .from('law_documents')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 失败:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ 成功 - 找到', data.length, '个法律文档')
    }
  } catch (err) {
    console.log('❌ 异常:', err.message)
    allTestsPassed = false
  }

  // 测试5: 创建测试对话（写入测试）
  console.log('\n✏️  测试5: 创建测试对话（写入测试）')
  try {
    const testConversation = {
      user_id: '00000000-0000-0000-0000-000000000000', // 临时用户ID
      title: '测试对话 - ' + new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
    
    if (error) {
      console.log('❌ 失败:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ 成功 - 创建了对话，ID:', data[0].id)
      
      // 清理测试数据
      await supabase
        .from('conversations')
        .delete()
        .eq('id', data[0].id)
      
      console.log('🧹 清理测试数据完成')
    }
  } catch (err) {
    console.log('❌ 异常:', err.message)
    allTestsPassed = false
  }

  // 总结
  console.log('\n' + '='.repeat(50))
  if (allTestsPassed) {
    console.log('🎉 所有测试通过！数据库访问正常')
    console.log('\n✨ 您现在可以:')
    console.log('   - 在网页中读取数据库内容')
    console.log('   - 创建和保存对话')
    console.log('   - 发送和接收消息')
    console.log('   - 访问法律文档数据')
  } else {
    console.log('⚠️  部分测试失败，可能需要进一步处理 RLS 策略')
    console.log('\n🔧 解决方案:')
    console.log('   1. 在 Supabase Dashboard 中执行 disable-all-rls.sql')
    console.log('   2. 或者逐个执行 ALTER TABLE ... DISABLE ROW LEVEL SECURITY')
  }
  console.log('='.repeat(50))
}

// 执行测试
testFullDatabaseAccess().catch(console.error)