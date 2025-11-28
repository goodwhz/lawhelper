// 创建管理员账号脚本
const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const supabaseUrl = 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MzYyMCwiZXhwIjoyMDc1ODU5NjIwfQ.cYqK8nVt6rNzHsP_2h1jNj0y4BFlT2wQsA2X1M5o3k' // 这是服务密钥，需要替换为实际的服务密钥

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminAccount() {
  try {
    console.log('开始创建管理员账号...')
    
    // 管理员账号信息
    const adminEmail = 'admin@lawhelper.com'
    const adminPassword = 'Admin123!@#'
    const adminName = '系统管理员'
    
    // 1. 创建用户账号
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // 自动验证邮箱
      user_metadata: {
        name: adminName,
        role: 'admin'
      }
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('管理员账号已存在，更新用户资料...')
        
        // 获取现有用户
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === adminEmail)
        
        if (existingUser) {
          // 更新用户资料
          const { error: updateError } = await supabase
            .from('user_profiles')
            .upsert({
              id: existingUser.id,
              email: adminEmail,
              name: adminName,
              role: 'admin',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            
          if (updateError) {
            console.error('更新管理员资料失败:', updateError)
            return
          }
          
          console.log('管理员账号更新成功')
          console.log('邮箱:', adminEmail)
          console.log('密码:', adminPassword)
          return
        }
      } else {
        console.error('创建管理员账号失败:', authError)
        return
      }
    }
    
    if (authData?.user) {
      // 2. 创建用户资料
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: adminEmail,
          name: adminName,
          role: 'admin'
        })
      
      if (profileError) {
        console.error('创建管理员资料失败:', profileError)
        return
      }
      
      console.log('管理员账号创建成功！')
      console.log('邮箱:', adminEmail)
      console.log('密码:', adminPassword)
      console.log('请妥善保管这些信息')
    }
    
  } catch (error) {
    console.error('创建管理员账号时发生错误:', error)
  }
}

// 执行脚本
createAdminAccount()