// 测试用户管理API
const testUserManagement = async () => {
  console.log('=== 测试用户管理API ===')
  
  try {
    // 首先获取当前用户的token
    console.log('1. 获取用户token...')
    const { supabase } = await import('./lib/supabaseClient.js')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取session失败:', error)
      return
    }
    
    if (!session?.access_token) {
      console.error('未找到有效的session token')
      return
    }
    
    console.log('✓ Token获取成功')
    
    // 测试获取用户列表
    console.log('2. 测试获取用户列表...')
    const response = await fetch('http://localhost:3000/api/admin/users?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✓ 用户列表获取成功')
      console.log(`- 总用户数: ${data.pagination.total}`)
      console.log(`- 当前页用户数: ${data.users.length}`)
      
      if (data.users.length > 0) {
        console.log('- 第一个用户:', {
          id: data.users[0].id,
          email: data.users[0].email,
          name: data.users[0].name,
          role: data.users[0].role
        })
      }
    } else {
      const errorText = await response.text()
      console.error('✗ 用户列表获取失败:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
testUserManagement()