// 测试删除功能的完整脚本
// 在浏览器控制台中运行

async function testDeleteFunction() {
  console.log('=== 测试删除功能修复 ===')

  try {
    // 1. 获取当前用户和对话列表
    const { supabase } = await import('/lib/supabaseClient.js')

    // 检查认证状态
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ 用户未登录:', sessionError)
      return
    }

    console.log('✅ 用户已登录:', session.user.email)

    // 2. 获取对话列表
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')

    if (convError) {
      console.error('❌ 获取对话列表失败:', convError)
      return
    }

    if (!conversations || conversations.length === 0) {
      console.log('⚠️ 没有找到对话，创建测试对话...')

      // 创建测试对话
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user.id,
          title: '测试删除功能',
          status: 'active',
        })
        .select('*')
        .single()

      if (createError) {
        console.error('❌ 创建测试对话失败:', createError)
        return
      }

      console.log('✅ 创建测试对话成功:', newConv)
      conversations.push(newConv)
    }

    console.log('📋 当前对话列表:')
    conversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. ID: ${conv.id}, 标题: ${conv.title}`)
    })

    // 3. 测试删除第一个对话
    if (conversations.length > 0) {
      const testConversation = conversations[0]
      console.log(`\n🗑️ 准备删除对话: ${testConversation.title} (ID: ${testConversation.id})`)

      // 调用API删除对话
      const deleteResponse = await fetch(`/api/conversations/${testConversation.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      console.log('删除响应状态:', deleteResponse.status)
      const deleteResult = await deleteResponse.json()
      console.log('删除响应内容:', deleteResult)

      if (deleteResponse.ok) {
        console.log('✅ 删除成功!')

        // 4. 验证删除结果
        console.log('\n🔍 验证删除结果...')
        const { data: remainingConvs, error: verifyError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')

        if (verifyError) {
          console.error('❌ 验证查询失败:', verifyError)
        } else {
          console.log(`✅ 验证成功，剩余对话数: ${remainingConvs?.length || 0}`)
          console.log('剩余对话:', remainingConvs?.map(c => ({ id: c.id, title: c.title })) || [])
        }
      } else {
        console.error('❌ 删除失败:', deleteResult)
      }
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

console.log('运行 testDeleteFunction() 来测试删除功能')
console.log('这个脚本会测试完整的删除流程')
