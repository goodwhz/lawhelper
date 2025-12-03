// 测试用户删除功能的脚本
// 在浏览器控制台中运行

async function testDeleteUser() {
  console.log('=== 开始测试用户删除功能 ===')
  
  try {
    // 获取当前session
    const { supabase } = await import('/lib/supabaseClient.js')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('请先登录管理员账号')
      return
    }
    
    console.log('当前管理员:', session.user.email)
    
    // 获取用户列表
    const usersResponse = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (!usersResponse.ok) {
      console.error('获取用户列表失败:', await usersResponse.text())
      return
    }
    
    const usersData = await usersResponse.json()
    console.log('当前用户列表:', usersData.users.map(u => `${u.email} (${u.role})`))
    
    // 找一个测试用户（非管理员用户）
    const testUser = usersData.users.find(u => u.role === 'user')
    if (!testUser) {
      console.warn('没有找到可用于测试的普通用户')
      return
    }
    
    console.log(`准备删除测试用户: ${testUser.email}`)
    
    // 执行删除
    const deleteResponse = await fetch(`/api/admin/users?userId=${testUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    const deleteResult = await deleteResponse.json()
    
    if (deleteResponse.ok) {
      console.log('✅ 用户删除成功:', deleteResult.message)
      
      // 验证删除结果
      console.log('验证删除结果...')
      const verifyResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const verifyData = await verifyResponse.json()
      const deletedUser = verifyData.users.find(u => u.id === testUser.id)
      
      if (!deletedUser) {
        console.log('✅ 验证成功：用户已从列表中移除')
      } else {
        console.log('❌ 验证失败：用户仍在列表中')
      }
      
    } else {
      console.error('❌ 用户删除失败:', deleteResult)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

console.log('运行 testDeleteUser() 来测试删除功能')
console.log('⚠️ 这将删除一个测试用户，请谨慎操作')