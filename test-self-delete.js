// 测试用户自删除功能的脚本
// 在浏览器控制台中运行

async function testSelfDelete() {
  console.log('=== 开始测试用户自删除功能 ===')
  
  try {
    // 测试用户凭据（需要替换为实际存在的测试用户）
    const testEmail = 'test@example.com' // 替换为测试用户邮箱
    const testPassword = 'test123456'     // 替换为测试用户密码
    
    console.log(`准备测试用户自删除: ${testEmail}`)
    
    // 测试删除接口
    const deleteResponse = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })
    
    const deleteResult = await deleteResponse.json()
    console.log('删除响应:', deleteResult)
    
    if (deleteResponse.ok) {
      console.log('✅ 用户自删除成功:', deleteResult.message)
      
      // 验证删除结果 - 尝试用相同凭据登录
      console.log('验证删除结果...尝试重新登录...')
      const { supabase } = await import('/lib/supabaseClient.js')
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (signInError) {
        console.log('✅ 验证成功：用户无法重新登录 -', signInError.message)
      } else {
        console.log('❌ 验证失败：用户仍能登录', signInData.user)
      }
      
    } else {
      console.error('❌ 用户自删除失败:', deleteResult)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

console.log('运行 testSelfDelete() 来测试用户自删除功能')
console.log('⚠️ 需要先修改 testEmail 和 testPassword 为实际测试用户凭据')