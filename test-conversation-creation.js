// 测试对话创建功能
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'
)

async function testConversationCreation() {
  console.log('🔍 测试对话创建功能...')
  
  // 模拟登录 - 这里使用一个测试用户的凭据
  console.log('\n1. 尝试登录...')
  
  // 由于我们无法自动登录，让我们先检查当前是否有用户会话
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.log('❌ 获取会话失败:', sessionError.message)
    return
  }
  
  if (!session?.user) {
    console.log('❌ 没有活跃用户会话，请先登录应用')
    console.log('💡 请在浏览器中访问 http://localhost:3005/auth/login 登录后再测试')
    return
  }
  
  console.log('✅ 当前用户:', session.user.email)
  
  // 2. 测试创建对话
  console.log('\n2. 创建新对话...')
  
  try {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: session.user.id,
        title: '测试对话 - ' + new Date().toLocaleTimeString(),
        status: 'active'
      })
      .select()
      .single()

    if (convError) {
      console.log('❌ 创建对话失败:', convError.message)
      console.log('错误详情:', convError)
      return
    }

    console.log('✅ 创建对话成功:', conversation.id)
    
    // 3. 测试添加消息
    console.log('\n3. 添加测试消息...')
    
    const userMessage = {
      conversation_id: conversation.id,
      user_id: session.user.id,
      content: '这是一条测试用户消息',
      role: 'user'
    }

    const { data: savedUserMsg, error: userMsgError } = await supabase
      .from('messages')
      .insert(userMessage)
      .select()
      .single()

    if (userMsgError) {
      console.log('❌ 保存用户消息失败:', userMsgError.message)
    } else {
      console.log('✅ 用户消息保存成功:', savedUserMsg.id)
    }

    const aiMessage = {
      conversation_id: conversation.id,
      user_id: session.user.id,
      content: '这是一条测试AI回复消息',
      role: 'assistant'
    }

    const { data: savedAiMsg, error: aiMsgError } = await supabase
      .from('messages')
      .insert(aiMessage)
      .select()
      .single()

    if (aiMsgError) {
      console.log('❌ 保存AI消息失败:', aiMsgError.message)
    } else {
      console.log('✅ AI消息保存成功:', savedAiMsg.id)
    }

    // 4. 验证消息列表
    console.log('\n4. 验证消息列表...')
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.log('❌ 获取消息失败:', msgError.message)
    } else {
      console.log('✅ 获取消息成功，共', messages.length, '条消息')
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.role}] ${msg.content}`)
      })
    }

    // 5. 清理测试数据
    console.log('\n5. 清理测试数据...')
    
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversation.id)

    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id)

    console.log('🧹 测试数据清理完成')

  } catch (err) {
    console.log('❌ 测试过程中发生错误:', err.message)
  }
}

testConversationCreation().then(() => {
  console.log('\n🏁 对话创建测试完成')
}).catch(err => {
  console.error('测试执行失败:', err)
})