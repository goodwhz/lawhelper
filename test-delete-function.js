// 测试删除对话功能

async function testDeleteFunction() {
  console.log('🧪 测试删除对话功能...\n')
  
  // 1. 测试 API 端点状态
  console.log('1. 检查 API 端点...')
  try {
    const response = await fetch('http://localhost:3006/api/conversations/test-id', {
      method: 'DELETE'
    })
    
    console.log('API 响应状态:', response.status)
    const text = await response.text()
    console.log('API 响应内容:', text)
    
    if (response.status === 401) {
      console.log('✅ 认证检查正常工作')
    } else if (response.status === 500) {
      console.log('❌ 服务器错误，需要检查数据库函数')
    }
    
  } catch (error) {
    console.log('❌ API 调用失败:', error.message)
  }
  
  // 2. 测试删除函数设置
  console.log('\n2. 检查删除函数设置...')
  try {
    const setupResponse = await fetch('http://localhost:3006/api/setup-delete-function', {
      method: 'GET'
    })
    
    if (setupResponse.ok) {
      const data = await setupResponse.json()
      console.log('✅ 删除函数设置指导可用')
      console.log('指导信息:', data.message)
    } else {
      console.log('❌ 无法获取设置指导')
    }
  } catch (error) {
    console.log('❌ 设置指导请求失败:', error.message)
  }
  
  console.log('\n📋 建议步骤:')
  console.log('1. 确保 Supabase 数据库已执行 RLS 修复:')
  console.log('   ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;')
  console.log('2. 在应用中测试删除对话功能')
  console.log('3. 如果仍有问题，访问 /ai-chat-debug 查看详细日志')
  
  console.log('\n🏁 测试完成')
}

testDeleteFunction().catch(console.error)