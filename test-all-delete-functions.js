// 测试所有删除功能的完整脚本
// 在浏览器控制台中运行

async function testAllDeleteFunctions() {
  console.log('=== 测试所有删除功能 ===')
  
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
    console.log('\n📋 步骤1: 获取用户列表...')
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
    console.log(`当前共有 ${usersData.users.length} 个用户`)
    usersData.users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) ID: ${user.id}`)
    })
    
    // 找到测试用户
    const testUsers = usersData.users.filter(u => u.role === 'user')
    
    if (testUsers.length === 0) {
      console.warn('⚠️ 没有找到可用于测试的普通用户')
      return
    }
    
    if (testUsers.length >= 2) {
      // 测试批量删除（如果有多个测试用户）
      console.log('\n🗑️ 步骤2: 测试批量删除功能...')
      const usersToDelete = testUsers.slice(0, 2) // 删除前2个测试用户
      const userIds = usersToDelete.map(u => u.id)
      
      console.log(`准备批量删除: ${usersToDelete.map(u => u.email).join(', ')}`)
      
      const batchDeleteResponse = await fetch('/api/admin/users/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          userIds: userIds
        })
      })
      
      const batchResult = await batchDeleteResponse.json()
      
      if (batchDeleteResponse.ok) {
        console.log('✅ 批量删除成功:', batchResult.message)
      } else {
        console.error('❌ 批量删除失败:', batchResult)
      }
      
      // 验证批量删除结果
      console.log('\n验证批量删除结果...')
      const verifyBatchResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const verifyBatchData = await verifyBatchResponse.json()
      const remainingDeletedUsers = verifyBatchData.users.filter(u => userIds.includes(u.id))
      
      if (remainingDeletedUsers.length === 0) {
        console.log('✅ 批量删除验证成功：所有用户已从列表中移除')
      } else {
        console.log('❌ 批量删除验证失败：仍有用户在列表中')
        remainingDeletedUsers.forEach(u => console.log(`  - ${u.email}`))
      }
      
    } else if (testUsers.length === 1) {
      // 测试单个删除
      console.log('\n🗑️ 步骤2: 测试单个删除功能...')
      const testUser = testUsers[0]
      
      console.log(`准备删除: ${testUser.email}`)
      
      const singleDeleteResponse = await fetch(`/api/admin/users?userId=${testUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const singleResult = await singleDeleteResponse.json()
      
      if (singleDeleteResponse.ok) {
        console.log('✅ 单个删除成功:', singleResult.message)
      } else {
        console.error('❌ 单个删除失败:', singleResult)
      }
      
      // 验证单个删除结果
      console.log('\n验证单个删除结果...')
      const verifySingleResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const verifySingleData = await verifySingleResponse.json()
      const deletedUser = verifySingleData.users.find(u => u.id === testUser.id)
      
      if (!deletedUser) {
        console.log('✅ 单个删除验证成功：用户已从列表中移除')
      } else {
        console.log('❌ 单个删除验证失败：用户仍在列表中')
      }
    }
    
    // 3. 最终检查所有用户
    console.log('\n📊 步骤3: 最终用户列表检查...')
    const finalUsersResponse = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (finalUsersResponse.ok) {
      const finalUsersData = await finalUsersResponse.json()
      console.log(`最终共有 ${finalUsersData.users.length} 个用户`)
      finalUsersData.users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) ID: ${user.id}`)
      })
    }
    
    console.log('\n🎉 测试完成！')
    console.log('💡 提示：被删除的用户应该无法再次登录系统')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

console.log('运行 testAllDeleteFunctions() 来测试所有删除功能')
console.log('⚠️ 这会实际删除用户，请谨慎操作！')
console.log('建议先备份数据或在测试环境中运行')