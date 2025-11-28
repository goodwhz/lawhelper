const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function testAdminProfileUpdate() {
  console.log('=== 测试管理员账户个人资料修改功能 ===\n')

  // 1. 登录管理员账户
  console.log('1. 登录管理员账户...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@lawhelper.com',
    password: 'admin123456',
  })

  if (signInError) {
    console.log('❌ 管理员登录失败:', signInError.message)
    return
  }

  console.log('✅ 管理员登录成功')
  console.log('用户ID:', signInData.user.id)
  console.log('邮箱:', signInData.user.email)
  console.log('邮箱验证状态:', signInData.user.email_confirmed_at ? '已验证' : '未验证')
  console.log('')

  // 2. 查询当前用户资料
  console.log('2. 查询当前用户资料...')
  const { data: currentProfile, error: currentError } = await supabase.rpc('get_user_profile', {
    user_id: signInData.user.id,
  })

  if (currentError) {
    console.log('❌ 查询用户资料失败:', currentError.message)
  } else {
    console.log('✅ 查询成功')
    console.log('当前资料:', JSON.stringify(currentProfile[0], null, 2))
  }
  console.log('')

  // 3. 测试更新用户资料
  console.log('3. 测试更新用户资料...')
  const testUpdates = [
    { name: '刘农管理员', role: 'admin' },
    { name: 'Administrator Liu', role: 'admin' },
    { name: '超级管理员', role: 'admin' },
  ]

  for (let i = 0; i < testUpdates.length; i++) {
    const update = testUpdates[i]
    console.log(`  测试更新 ${i + 1}:`, update)

    const { data: updateData, error: updateError } = await supabase.rpc('upsert_user_profile', {
      user_id: signInData.user.id,
      user_email: signInData.user.email,
      user_name: update.name,
      user_role: update.role,
    })

    if (updateError) {
      console.log(`  ❌ 更新 ${i + 1} 失败:`, updateError.message)
    } else {
      console.log(`  ✅ 更新 ${i + 1} 成功`)
      console.log('  更新后数据:', JSON.stringify(updateData[0], null, 2))
    }

    // 等待一秒再进行下次更新
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  console.log('')

  // 4. 验证最终数据
  console.log('4. 验证最终用户资料...')
  const { data: finalProfile, error: finalError } = await supabase.rpc('get_user_profile', {
    user_id: signInData.user.id,
  })

  if (finalError) {
    console.log('❌ 最终查询失败:', finalError.message)
  } else {
    console.log('✅ 最终查询成功')
    console.log('最终资料:', JSON.stringify(finalProfile[0], null, 2))
  }
  console.log('')

  // 5. 检查数据库中的实际数据
  console.log('5. 直接查询数据库表验证...')
  const { data: directData, error: directError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', signInData.user.id)
    .single()

  if (directError) {
    console.log('❌ 直接查询失败:', directError.message)
  } else {
    console.log('✅ 直接查询成功')
    console.log('数据库中的实际数据:', JSON.stringify(directData, null, 2))
  }
  console.log('')

  // 6. 登出
  console.log('6. 登出...')
  const { error: signOutError } = await supabase.auth.signOut()

  if (signOutError) {
    console.log('❌ 登出失败:', signOutError.message)
  } else {
    console.log('✅ 登出成功')
  }

  console.log('\n=== 测试完成 ===')
}

// 运行测试
testAdminProfileUpdate().catch(console.error)
