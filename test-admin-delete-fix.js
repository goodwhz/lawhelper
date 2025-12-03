// 测试修复后的管理员删除功能
// 在浏览器控制台中运行

async function testAdminDeleteFix() {
  console.log('=== 测试修复后的管理员删除功能 ===')
  
  try {
    // 获取管理员session
    const { supabase } = await import('/lib/supabaseClient.js')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ 请先登录管理员账号')
      return
    }
    
    console.log('✅ 管理员session获取成功:', session.user.email)
    
    // 1. 获取用户列表
    console.log('\n步骤1: 获取用户列表...')
    const usersResponse = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (!usersResponse.ok) {
      console.error('❌ 获取用户列表失败:', await usersResponse.text())
      return
    }
    
    const usersData = await usersResponse.json()
    console.log('当前用户列表:')
    usersData.users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) ID: ${user.id}`)
    })
    
    // 找一个测试用户（非管理员用户）
    const testUser = usersData.users.find(u => u.role === 'user')
    if (!testUser) {
      console.warn('⚠️ 没有找到可用于测试的普通用户')
      console.log('创建测试用户或者选择一个现有用户进行测试...')
      return
    }
    
    console.log(`\n步骤2: 准备删除测试用户: ${testUser.email}`)
    
    // 2. 执行删除
    console.log('执行删除操作...')
    const deleteResponse = await fetch(`/api/admin/users?userId=${testUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    const deleteResult = await deleteResponse.json()
    console.log('删除响应:', deleteResult)
    
    if (deleteResponse.ok) {
      console.log('✅ 管理员删除请求成功:', deleteResult.message)
      
      // 3. 验证删除结果
      console.log('\n步骤3: 验证删除结果...')
      
      // 3.1 检查用户是否还在列表中
      const verifyResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const verifyData = await verifyResponse.json()
      const deletedUser = verifyData.users.find(u => u.id === testUser.id)
      
      if (!deletedUser) {
        console.log('✅ 验证成功：用户已从管理员列表中移除')
      } else {
        console.log('❌ 验证失败：用户仍在管理员列表中')
      }
      
      // 3.2 尝试登录测试用户（验证Auth删除）
      console.log('\n步骤4: 测试用户是否还能登录...')
      console.log(`尝试登录: ${testUser.email}`)
      
      // 这里需要知道测试用户的密码，我们无法获取
      // 所以我们用调试端点检查Auth状态
      const debugResponse = await fetch('/api/debug/check-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: testUser.id
        })
      })
      
      if (debugResponse.ok) {
        const debugResult = await debugResponse.json()
        console.log('Auth状态检查结果:', debugResult.results)
      } else {
        console.log('无法检查Auth状态:', await debugResponse.text())
      }
      
    } else {
      console.error('❌ 管理员删除失败:', deleteResult)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

console.log('运行 testAdminDeleteFix() 来测试修复后的管理员删除功能')
console.log('⚠️ 这将删除一个测试用户，请谨慎操作')