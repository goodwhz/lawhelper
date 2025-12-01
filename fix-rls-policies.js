// 修复 RLS 策略脚本
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duyfvvbgadrwaonvlrun.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixRLSPolicies() {
  console.log('🔧 开始修复 RLS 策略...')
  
  // 需要使用 SERVICE_ROLE_KEY 来管理 RLS 策略
  // 但我们只有 anon key，所以需要通过 SQL 来执行
  
  const rlsFixes = [
    // 删除所有现有的 RLS 策略
    `DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;`,
    `DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;`,
    `DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;`,
    `DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;`,
    `DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;`,
    `DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;`,
    `DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;`,
    `DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;`,
    `DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;`,
    `DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;`,
    `DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;`,
    
    // 重新创建简化的 RLS 策略
    // 用户配置表策略
    `CREATE POLICY "Enable insert for users" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
    `CREATE POLICY "Enable select for users" ON public.user_profiles FOR SELECT USING (auth.uid() = id);`,
    `CREATE POLICY "Enable update for users" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);`,
    
    // 对话表策略
    `CREATE POLICY "Enable insert for users" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Enable select for users" ON public.conversations FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Enable update for users" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Enable delete for users" ON public.conversations FOR DELETE USING (auth.uid() = user_id);`,
    
    // 消息表策略
    `CREATE POLICY "Enable insert for users" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Enable select for users" ON public.messages FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Enable update for users" ON public.messages FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Enable delete for users" ON public.messages FOR DELETE USING (auth.uid() = user_id);`,
    
    // 临时禁用 RLS 进行测试
    // `ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;`,
    // `ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;`,
    // `ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;`
  ]

  // 由于我们不能直接执行 DDL 语句，我们需要通过 RPC 或其他方式
  // 让我们先测试当前权限，然后提供一个解决方案
  
  console.log('📋 测试当前权限...')
  
  try {
    // 测试获取当前会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ 获取会话失败:', sessionError.message)
      return
    }
    
    if (!session?.user) {
      console.log('❌ 没有活跃用户会话，无法测试权限')
      console.log('💡 请先在浏览器中登录，然后再次运行此脚本')
      return
    }
    
    console.log('✅ 当前用户:', session.user.email)
    
    // 测试各种操作的权限
    console.log('\n🧪 测试对话创建权限...')
    
    const testConversation = {
      user_id: session.user.id,
      title: 'RLS测试对话',
      status: 'active'
    }
    
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
      .single()
    
    if (convError) {
      console.log('❌ 对话创建失败:', convError.message)
      console.log('错误代码:', convError.code)
      console.log('错误详情:', convError)
      
      if (convError.code === '42501' || convError.message.includes('permission denied')) {
        console.log('🔍 这是权限问题，需要调整 RLS 策略')
      }
    } else {
      console.log('✅ 对话创建成功:', convData.id)
      
      // 测试消息创建权限
      console.log('\n🧪 测试消息创建权限...')
      
      const testMessage = {
        conversation_id: convData.id,
        user_id: session.user.id,
        content: 'RLS测试消息',
        role: 'user'
      }
      
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single()
      
      if (msgError) {
        console.log('❌ 消息创建失败:', msgError.message)
        console.log('错误代码:', msgError.code)
        console.log('错误详情:', msgError)
      } else {
        console.log('✅ 消息创建成功:', msgData.id)
      }
      
      // 清理测试数据
      await supabase.from('messages').delete().eq('conversation_id', convData.id)
      await supabase.from('conversations').delete().eq('id', convData.id)
      console.log('🧹 测试数据清理完成')
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message)
  }
  
  console.log('\n📝 建议:')
  console.log('如果上述测试失败，请执行以下 SQL 命令来修复 RLS 策略:')
  console.log('')
  console.log('-- 在 Supabase Dashboard 的 SQL Editor 中执行以下命令:')
  console.log('')
  
  rlsFixes.forEach(sql => {
    console.log(sql)
  })
  
  console.log('')
  console.log('或者临时禁用 RLS 进行测试:')
  console.log('ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;')
  console.log('ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;')
  console.log('ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;')
}

fixRLSPolicies().then(() => {
  console.log('\n🏁 RLS 策略检查完成')
}).catch(err => {
  console.error('执行失败:', err)
})