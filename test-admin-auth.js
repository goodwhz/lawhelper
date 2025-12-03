// 测试管理员权限的脚本
// 在浏览器控制台中运行此代码

async function testAdminAuth() {
  console.log('=== 开始测试管理员权限 ===')
  
  try {
    // 导入 supabase 客户端
    const { supabase } = await import('/lib/supabaseClient.js')
    
    // 检查当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('当前用户:', user?.email, userError)
    
    // 检查session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('当前session:', !!session, sessionError)
    
    if (!session) {
      console.warn('用户未登录')
      return
    }
    
    // 测试获取用户列表
    console.log('测试获取用户列表...')
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    console.log('API响应状态:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('用户列表获取成功:', data.users?.length, '个用户')
    } else {
      const errorText = await response.text()
      console.error('获取用户列表失败:', response.status, errorText)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 自动运行测试
testAdminAuth()