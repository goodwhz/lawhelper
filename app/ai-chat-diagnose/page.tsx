'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AiChatDiagnose: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    setLogs(prev => [...prev, logEntry])
  }

  const diagnoseStep1 = async () => {
    addLog('🔍 步骤 1: 检查认证状态')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addLog(`❌ 获取会话失败: ${error.message}`)
        return false
      }
      
      if (!session?.user) {
        addLog('❌ 用户未登录')
        addLog('💡 请先访问 /auth/login 登录')
        return false
      }
      
      addLog(`✅ 用户已登录: ${session.user.email}`)
      addLog(`📝 用户 ID: ${session.user.id}`)
      setCurrentUser(session.user)
      return true
    } catch (error) {
      addLog(`❌ 认证检查异常: ${error}`)
      return false
    }
  }

  const diagnoseStep2 = async () => {
    addLog('🔍 步骤 2: 检查数据库连接和表')
    
    try {
      // 测试连接
      addLog('测试数据库连接...')
      
      // 检查表是否存在
      const tables = ['user_profiles', 'conversations', 'messages']
      
      for (const tableName of tables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (error) {
            addLog(`❌ 表 ${tableName} 错误: ${error.message}`)
            addLog(`🔧 错误代码: ${error.code}`)
            return false
          } else {
            addLog(`✅ 表 ${tableName} 存在，记录数: ${count}`)
          }
        } catch (err) {
          addLog(`❌ 表 ${tableName} 检查异常: ${err}`)
          return false
        }
      }
      
      return true
    } catch (error) {
      addLog(`❌ 数据库连接检查异常: ${error}`)
      return false
    }
  }

  const diagnoseStep3 = async () => {
    if (!currentUser) {
      addLog('❌ 需要先通过步骤 1 认证')
      return false
    }
    
    addLog('🔍 步骤 3: 测试对话创建权限')
    
    try {
      const conversationData = {
        user_id: currentUser.id,
        title: '诊断测试对话',
        status: 'active'
      }
      
      addLog(`📝 对话数据: ${JSON.stringify(conversationData)}`)
      
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) {
        addLog(`❌ 对话创建失败: ${error.message}`)
        addLog(`🔧 错误详情: ${JSON.stringify({
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        })}`)
        
        // 分析具体错误类型
        if (error.code === '42501' || error.message.includes('permission denied')) {
          addLog('🔍 这是 RLS 权限问题!')
          addLog('💡 解决方案: 在 Supabase Dashboard 中禁用 RLS 或修复策略')
          addLog('📝 SQL 命令: ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;')
        }
        
        if (error.message.includes('null value')) {
          addLog('🔍 这是数据约束问题!')
          addLog('💡 某些必填字段缺失或为空')
        }
        
        return false
      }
      
      addLog(`✅ 对话创建成功! ID: ${data.id}`)
      
      // 清理测试数据
      await supabase.from('conversations').delete().eq('id', data.id)
      addLog('🧹 测试数据清理完成')
      
      return true
    } catch (error) {
      addLog(`❌ 对话创建异常: ${error}`)
      if (error instanceof Error) {
        addLog(`🔧 错误名称: ${error.name}`)
        addLog(`🔧 错误消息: ${error.message}`)
      }
      return false
    }
  }

  const runFullDiagnosis = async () => {
    setIsRunning(true)
    setLogs([])
    
    addLog('🏥 开始完整诊断...')
    addLog('=' * 50)
    
    const step1Success = await diagnoseStep1()
    addLog('')
    
    const step2Success = await diagnoseStep2()
    addLog('')
    
    const step3Success = step1Success ? await diagnoseStep3() : false
    addLog('')
    
    addLog('=' * 50)
    
    if (step1Success && step2Success && step3Success) {
      addLog('🎉 所有测试通过! 对话创建功能正常')
      addLog('💡 如果应用中仍有问题，请检查前端组件逻辑')
    } else {
      addLog('❌ 存在问题，请查看上述错误信息')
      addLog('📋 建议解决方案:')
      
      if (!step1Success) {
        addLog('   1. 确保用户已登录')
      }
      if (!step2Success) {
        addLog('   2. 检查数据库表是否正确创建')
      }
      if (!step3Success) {
        addLog('   3. 修复 RLS 权限策略')
        addLog('   4. 查看 对话创建问题解决方案.md 文件')
      }
    }
    
    setIsRunning(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          AI 聊天诊断工具
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">诊断控制台</h2>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={runFullDiagnosis}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? '🔍 诊断中...' : '🏥 开始完整诊断'}
            </button>
            
            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🗑️ 清空日志
            </button>
            
            <button
              onClick={() => window.location.href = '/ai-chat'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              💬 返回聊天页面
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击"开始完整诊断"开始检查...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">快速解决方案</h2>
          
          <div className="space-y-4 text-sm">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold mb-2">1. RLS 权限问题（最常见）</h3>
              <p className="text-gray-600 mb-2">
                在 Supabase Dashboard 的 SQL Editor 中执行：
              </p>
              <code className="block bg-gray-100 p-2 rounded">
                ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
              </code>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold mb-2">2. 用户认证问题</h3>
              <p className="text-gray-600">
                确保用户已登录，访问 <a href="/auth/login" className="text-blue-600 underline">登录页面</a>
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold mb-2">3. 使用测试页面</h3>
              <p className="text-gray-600">
                尝试使用简化版本：<a href="/ai-chat-simple" className="text-blue-600 underline">/ai-chat-simple</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiChatDiagnose