// 测试最后登录时间功能
const testLastLogin = async () => {
  console.log('=== 测试最后登录时间功能 ===')
  
  try {
    // 获取当前用户
    const { supabase } = await import('./lib/supabaseClient.js')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取session失败:', error)
      return
    }
    
    if (!session?.user) {
      console.error('用户未登录')
      return
    }
    
    console.log('✓ 当前用户:', session.user.email)
    console.log('✓ 用户ID:', session.user.id)
    
    // 检查当前last_login_at值
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('last_login_at, updated_at')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('获取用户资料失败:', profileError)
      return
    }
    
    console.log('✓ 当前最后登录时间:', profile.last_login_at)
    console.log('✓ 资料更新时间:', profile.updated_at)
    
    // 手动更新最后登录时间进行测试
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        last_login_at: new Date().toISOString() 
      })
      .eq('id', session.user.id)
      .select('last_login_at')
      .single()
    
    if (updateError) {
      console.error('更新最后登录时间失败:', updateError)
      return
    }
    
    console.log('✓ 更新后最后登录时间:', updateData.last_login_at)
    
    // 测试API接口
    console.log('\n--- 测试API接口 ---')
    const response = await fetch('http://localhost:3000/api/admin/users?page=1&limit=5&sortBy=last_login_at&sortOrder=desc', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✓ API接口测试成功')
      console.log(`- 返回用户数: ${data.users.length}`)
      
      if (data.users.length > 0) {
        console.log('- 第一个用户最后登录时间:', data.users[0].last_login_at)
        console.log('- 排序字段:', 'last_login_at (desc)')
      }
    } else {
      const errorText = await response.text()
      console.error('✗ API接口测试失败:', {
        status: response.status,
        body: errorText
      })
    }
    
    console.log('\n=== 测试完成 ===')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
testLastLogin()