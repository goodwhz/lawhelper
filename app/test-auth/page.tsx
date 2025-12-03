'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestAuthPage() {
  const { user, isAdmin } = useAuth()
  const [tokenTest, setTokenTest] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testToken = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabaseClient')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      const result = {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none',
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: error?.message
      }
      
      setTokenTest(JSON.stringify(result, null, 2))
    } catch (error) {
      setTokenTest('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testToken()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">认证状态测试</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">AuthContext状态</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({
              hasUser: !!user,
              userId: user?.id,
              userEmail: user?.email,
              userName: user?.name,
              userRole: user?.role,
              isAdmin
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Supabase Session状态</h2>
          <button 
            onClick={testToken}
            disabled={loading}
            className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '重新测试Token'}
          </button>
          <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">
            {tokenTest || '点击按钮测试'}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">API测试</h2>
          <button 
            onClick={async () => {
              try {
                const { supabase } = await import('@/lib/supabaseClient')
                const { data: { session } } = await supabase.auth.getSession()
                
                if (session?.access_token) {
                  const response = await fetch('/api/admin/users', {
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`
                    }
                  })
                  
                  alert(`API响应: ${response.status} - ${response.ok ? '成功' : await response.text()}`)
                } else {
                  alert('没有有效的token')
                }
              } catch (error) {
                alert('API测试失败: ' + (error instanceof Error ? error.message : 'Unknown error'))
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            测试用户管理API
          </button>
        </div>
      </div>
    </div>
  )
}