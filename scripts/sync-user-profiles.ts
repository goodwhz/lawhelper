/**
 * 同步 auth.users 表数据到 public.user_profiles 表
 * 确保每个在 auth.users 中的用户在 public.user_profiles 中都有对应记录
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 需要服务角色密钥才能操作auth表

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AuthUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  raw_user_meta_data?: any
}

interface UserProfile {
  id: string
  email: string
  name?: string | null
  role: string
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

async function syncUserProfiles() {
  try {
    console.log('开始同步用户数据...')

    // 1. 获取所有 auth.users 中的用户
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email, created_at, updated_at, raw_user_meta_data')
      .schema('auth')

    if (authError) {
      console.error('获取 auth.users 失败:', authError)
      return
    }

    console.log(`找到 ${authUsers?.length || 0} 个认证用户`)

    // 2. 获取所有 public.user_profiles 中的用户
    const { data: existingProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, created_at, updated_at')
      .schema('public')

    if (profileError) {
      console.error('获取 public.user_profiles 失败:', profileError)
      return
    }

    console.log(`找到 ${existingProfiles?.length || 0} 个现有用户档案`)

    // 3. 找出需要同步的用户
    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || [])
    const usersToSync = authUsers?.filter(user => !existingProfileIds.has(user.id)) || []

    console.log(`需要同步 ${usersToSync.length} 个用户`)

    if (usersToSync.length === 0) {
      console.log('所有用户数据已同步，无需操作')
      return
    }

    // 4. 为缺失的用户创建 user_profiles 记录
    const profilesToInsert: UserProfile[] = usersToSync.map((user: AuthUser) => {
      // 尝试从 raw_user_meta_data 中获取用户姓名
      let userName = user.email.split('@')[0] // 默认使用邮箱前缀

      if (user.raw_user_meta_data) {
        const metaData = typeof user.raw_user_meta_data === 'string'
          ? JSON.parse(user.raw_user_meta_data)
          : user.raw_user_meta_data

        userName = metaData.name || metaData.full_name || metaData.display_name || userName
      }

      // 判断用户角色 - 这里可以根据业务逻辑调整
      // 默认为 'user'，如果邮箱包含admin等信息则设为'admin'
      let role = 'user'
      if (user.email.includes('admin') || user.email.includes('administrator')) {
        role = 'admin'
      }

      return {
        id: user.id,
        email: user.email,
        name: userName,
        role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: null,
      }
    })

    // 5. 批量插入用户档案
    const { data: insertedProfiles, error: insertError } = await supabase
      .from('user_profiles')
      .insert(profilesToInsert)
      .select()

    if (insertError) {
      console.error('插入用户档案失败:', insertError)
      return
    }

    console.log(`成功同步 ${insertedProfiles?.length || 0} 个用户档案:`)
    insertedProfiles?.forEach((profile) => {
      console.log(`- ${profile.email} (${profile.name}) - 角色: ${profile.role}`)
    })

    // 6. 验证同步结果
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role')

    if (finalError) {
      console.error('验证同步结果失败:', finalError)
      return
    }

    console.log(`\n同步完成！当前 user_profiles 表中共有 ${finalProfiles?.length || 0} 个用户`)
  } catch (error) {
    console.error('同步过程中发生错误:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncUserProfiles()
}

export { syncUserProfiles }
