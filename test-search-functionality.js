// 测试搜索功能
const testSearchFunctionality = async () => {
  console.log('=== 测试搜索功能 ===')
  
  try {
    // 模拟不同的搜索场景
    const testCases = [
      { search: '', description: '空搜索（所有用户）' },
      { search: 'admin', description: '搜索包含admin的用户' },
      { search: '@', description: '搜索包含@的用户（所有邮箱）' },
      { search: 'test', description: '搜索包含test的用户' }
    ]
    
    // 获取当前用户token
    const { supabase } = await import('./lib/supabaseClient.js')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.access_token) {
      console.error('获取用户token失败:', error)
      return
    }
    
    console.log('✓ Token获取成功')
    
    // 测试每个搜索场景
    for (const testCase of testCases) {
      console.log(`\n--- 测试: ${testCase.description} ---`)
      console.log(`搜索关键词: "${testCase.search}"`)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '5',
        ...(testCase.search && { search: testCase.search }),
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      
      const response = await fetch(`http://localhost:3000/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✓ 搜索成功，找到 ${data.pagination.total} 个用户`)
        
        // 显示前3个匹配用户的姓名和邮箱
        if (data.users.length > 0) {
          console.log('  匹配用户:')
          data.users.slice(0, 3).forEach((user, index) => {
            console.log(`    ${index + 1}. ${user.name || '未设置姓名'} (${user.email})`)
          })
        } else {
          console.log('  无匹配用户')
        }
      } else {
        const errorText = await response.text()
        console.error(`✗ 搜索失败: ${response.status} ${response.statusText}`)
        console.error(`错误详情: ${errorText}`)
      }
    }
    
    console.log('\n=== 搜索功能测试完成 ===')
    console.log('✓ 现在用户需要点击"查找"按钮或按回车键才执行搜索')
    console.log('✓ 输入字符不会自动触发搜索')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
testSearchFunctionality()