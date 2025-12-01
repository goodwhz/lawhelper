const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'
)

async function testSupabaseConnection() {
  console.log('🔗 测试 Supabase 连接...')
  console.log('='.repeat(50))

  try {
    // 测试1: 检查数据库连接
    console.log('\n📊 测试数据库连接...')
    const { data: tables, error: tablesError } = await supabase
      .from('law_categories')
      .select('count')
      .limit(1)

    if (tablesError) {
      console.error('❌ 数据库连接失败:', tablesError.message)
      console.error('   错误代码:', tablesError.code)
    } else {
      console.log('✅ 数据库连接成功')
    }

    // 测试2: 检查认证系统
    console.log('\n🔐 测试认证系统...')
    
    // 尝试注册测试用户
    const testEmail = 'test@example.com'
    const testPassword = 'Test123456!'
    
    console.log(`📝 尝试注册测试用户: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: '测试用户'
        }
      }
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  测试用户已存在，尝试登录...')
        
        // 尝试登录已存在的用户
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        })

        if (signInError) {
          console.error('❌ 登录失败:', signInError.message)
        } else {
          console.log('✅ 登录成功')
          console.log('👤 用户ID:', signInData.user.id)
          console.log('📧 用户邮箱:', signInData.user.email)
        }
      } else {
        console.error('❌ 注册失败:', signUpError.message)
      }
    } else {
      console.log('✅ 注册成功')
      console.log('👤 用户ID:', signUpData.user?.id)
      console.log('📧 用户邮箱:', signUpData.user?.email)
      console.log('📋 请检查邮箱并确认注册')
    }

    // 测试3: 检查存储桶
    console.log('\n📁 测试存储桶...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ 获取存储桶失败:', bucketsError.message)
    } else {
      console.log('✅ 存储桶连接成功')
      console.log('📦 可用存储桶:', buckets.map(b => b.name).join(', '))
    }

    // 测试4: 检查用户配置表
    console.log('\n👥 测试用户配置表...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (profilesError) {
      if (profilesError.code === 'PGRST116') {
        console.log('ℹ️  user_profiles 表不存在，这是正常的（需要手动创建）')
      } else {
        console.error('❌ 用户配置表查询失败:', profilesError.message)
      }
    } else {
      console.log('✅ 用户配置表连接成功')
    }

    console.log('\n🎉 Supabase 连接测试完成!')
    console.log('\n📝 下一步操作:')
    console.log('1. 在浏览器中访问: http://localhost:3002/test-supabase-login.html')
    console.log('2. 使用测试账号登录:')
    console.log('   - 邮箱: test@example.com')
    console.log('   - 密码: Test123456!')
    console.log('3. 或创建新账号进行测试')

  } catch (error) {
    console.error('❌ 连接测试失败:', error.message)
  }
}

testSupabaseConnection()