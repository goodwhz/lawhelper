/**
 * 验证用户数据同步状态
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySync() {
  try {
    console.log('🔍 验证用户数据同步状态...\n')

    // 1. 统计 auth.users 表
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .schema('auth')

    if (authError) {
      console.error('❌ 获取 auth.users 失败:', authError.message)
      return
    }

    // 2. 统计 public.user_profiles 表
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role')
      .schema('public')

    if (profileError) {
      console.error('❌ 获取 user_profiles 失败:', profileError.message)
      return
    }

    // 3. 检查同步状态
    console.log('📊 数据统计:')
    console.log(`   - auth.users: ${authUsers.length} 个用户`)
    console.log(`   - user_profiles: ${profiles.length} 个用户`)

    // 4. 详细同步检查
    const { data: syncCheck, error: syncError } = await supabase
      .rpc('check_user_sync')

    if (!syncError && syncCheck) {
      console.log(`\n✅ 同步状态: ${syncCheck.synced_users}/${syncCheck.total_users} 用户已同步`)

      if (syncCheck.unsynced_count > 0) {
        console.log(`\n⚠️  发现 ${syncCheck.unsynced_count} 个未同步用户:`)
        syncCheck.unsynced_users.forEach((user) => {
          console.log(`   - ${user.email} (${user.id})`)
        })
      } else {
        console.log('\n🎉 所有用户数据已完全同步！')
      }
    } else {
      // 手动检查同步状态
      const profileIds = new Set(profiles.map(p => p.id))
      const unsyncedUsers = authUsers.filter(user => !profileIds.has(user.id))

      if (unsyncedUsers.length > 0) {
        console.log(`\n⚠️  发现 ${unsyncedUsers.length} 个未同步用户:`)
        unsyncedUsers.forEach((user) => {
          console.log(`   - ${user.email} (${user.id})`)
        })
      } else {
        console.log('\n🎉 所有用户数据已完全同步！')
      }
    }

    // 5. 显示用户角色分布
    const roleStats = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1
      return acc
    }, {})

    console.log('\n👥 用户角色分布:')
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} 个用户`)
    })

    console.log('\n✅ 验证完成！')
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message)
  }
}

verifySync()
