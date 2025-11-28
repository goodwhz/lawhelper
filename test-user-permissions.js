// 测试用户权限的脚本
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserPermissions() {
  console.log('=== 测试用户权限 ===')
  
  // 1. 测试查询权限
  console.log('\n1. 测试查询用户资料...')
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
    } else {
      console.log('✅ 查询成功，返回记录数:', data?.length || 0)
    }
  } catch (err) {
    console.error('❌ 查询异常:', err.message)
  }
  
  // 2. 测试插入权限（需要先登录）
  console.log('\n2. 测试插入权限...')
  console.log('⚠️  需要先登录才能测试插入权限')
  
  // 3. 检查 RLS 策略
  console.log('\n3. 检查 RLS 策略状态...')
  try {
    const { data, error } = await supabase
      .rpc('get_user_profile', { user_id: '00000000-0000-0000-0000-000000000000' })
    
    if (error) {
      console.error('❌ RPC 调用失败:', error.message)
    } else {
      console.log('✅ RPC 调用正常')
    }
  } catch (err) {
    console.error('❌ RPC 调用异常:', err.message)
  }
  
  console.log('\n=== 权限测试完成 ===')
}

testUserPermissions()