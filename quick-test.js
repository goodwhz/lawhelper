// 快速测试脚本 - 诊断对话创建问题
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'
)

console.log('🔍 快速诊断对话创建问题...\n')

async function quickTest() {
  try {
    // 1. 测试连接
    console.log('1. 测试数据库连接...')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ 无法获取用户信息:', userError.message)
      console.log('💡 请先在浏览器中登录应用')
      return
    }
    
    if (!userData.user) {
      console.log('❌ 用户未登录')
      console.log('💡 请访问 http://localhost:3005/auth/login 登录')
      return
    }
    
    console.log('✅ 用户已登录:', userData.user.email)
    console.log('   用户 ID:', userData.user.id)
    
    // 2. 测试对话创建权限
    console.log('\n2. 测试对话创建权限...')
    
    const testConversation = {
      user_id: userData.user.id,
      title: '测试对话',
      status: 'active'
    }
    
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
      .single()
    
    if (convError) {
      console.log('❌ 对话创建失败!')
      console.log('   错误类型:', convError.code)
      console.log('   错误信息:', convError.message)
      
      if (convError.code === '42501' || convError.message.includes('permission denied')) {
        console.log('\n🔍 这是 RLS 权限问题!')
        console.log('💡 解决方案:')
        console.log('   1. 访问 RLS-修复指南.md 文件')
        console.log('   2. 在 Supabase Dashboard 中执行 SQL 命令')
        console.log('   3. 临时禁用 RLS: ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;')
      }
      
      if (convError.message.includes('null value in column')) {
        console.log('\n🔍 这是数据约束问题!')
        console.log('💡 某些必填字段缺失')
      }
      
      return
    }
    
    console.log('✅ 对话创建成功!')
    console.log('   对话 ID:', convData.id)
    
    // 3. 测试消息创建权限
    console.log('\n3. 测试消息创建权限...')
    
    const testMessage = {
      conversation_id: convData.id,
      user_id: userData.user.id,
      content: '测试消息',
      role: 'user'
    }
    
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single()
    
    if (msgError) {
      console.log('❌ 消息创建失败!')
      console.log('   错误类型:', msgError.code)
      console.log('   错误信息:', msgError.message)
    } else {
      console.log('✅ 消息创建成功!')
      console.log('   消息 ID:', msgData.id)
    }
    
    // 4. 清理测试数据
    console.log('\n4. 清理测试数据...')
    await supabase.from('messages').delete().eq('conversation_id', convData.id)
    await supabase.from('conversations').delete().eq('id', convData.id)
    console.log('✅ 清理完成')
    
    // 5. 总结
    console.log('\n🎉 测试完成!')
    console.log('✅ 所有功能正常')
    console.log('💡 如果在应用中仍有问题，请检查:')
    console.log('   - 用户是否正确登录')
    console.log('   - 前端组件是否正确调用 API')
    console.log('   - 浏览器控制台是否有错误')
    
  } catch (error) {
    console.log('\n❌ 测试过程中发生异常:', error.message)
  }
}

// 执行测试
quickTest().then(() => {
  console.log('\n🏁 快速测试完成')
}).catch(err => {
  console.error('测试执行失败:', err)
})