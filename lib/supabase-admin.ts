/**
 * Supabase Admin API 工具函数
 * 直接使用HTTP API调用Supabase管理功能
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * 直接使用HTTP API删除用户
 * 这种方式绕过了Supabase JS SDK的潜在问题
 */
export async function deleteUserViaAPI(userId: string) {
  // Supabase Management API的正确格式
  const url = `${SUPABASE_URL}/rest/v1/rpc/delete_user`

  console.log('使用HTTP API删除用户:', { url, userId })

  try {
    // 方法1: 使用Admin REST API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
    })

    console.log('删除用户响应状态:', response.status)

    if (response.ok) {
      console.log('删除用户成功 (Admin API)')
      return { success: true, message: '认证记录删除成功 (Admin API)' }
    }

    // 如果Admin API失败，尝试其他方法
    console.log('Admin API失败，尝试备用方法...')

    // 方法2: 使用SQL函数删除
    const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        sql: `DELETE FROM auth.users WHERE id = '${userId}'`,
      }),
    })

    console.log('SQL删除响应状态:', sqlResponse.status)

    if (sqlResponse.ok) {
      console.log('删除用户成功 (SQL)')
      return { success: true, message: '认证记录删除成功 (SQL)' }
    }

    // 所有方法都失败
    const adminError = await response.text()
    const sqlError = await sqlResponse.text()

    return {
      success: false,
      error: `Admin API: ${response.status} - ${adminError} | SQL: ${sqlResponse.status} - ${sqlError}`,
    }
  } catch (error: any) {
    console.error('HTTP删除用户异常:', error)
    return {
      success: false,
      error: error.message || '网络请求失败',
    }
  }
}
