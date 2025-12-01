const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createChatTables() {
  console.log('🔄 开始创建聊天相关数据表...')
  
  try {
    // 1. 创建用户配置表
    console.log('\n📝 创建 user_profiles 表...')
    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (profileError && !profileError.message.includes('already exists')) {
      console.error('创建 user_profiles 表失败:', profileError.message)
    } else {
      console.log('✅ user_profiles 表创建成功')
    }

    // 2. 创建对话表
    console.log('\n📝 创建 conversations 表...')
    const { error: convError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL DEFAULT '新对话',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
          dify_conversation_id TEXT,
          metadata JSONB DEFAULT '{}',
          settings JSONB DEFAULT '{}',
          last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (convError && !convError.message.includes('already exists')) {
      console.error('创建 conversations 表失败:', convError.message)
    } else {
      console.log('✅ conversations 表创建成功')
    }

    // 3. 创建消息表
    console.log('\n📝 创建 messages 表...')
    const { error: msgError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          content TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          dify_message_id TEXT,
          message_files JSONB DEFAULT '[]',
          agent_thoughts JSONB DEFAULT '[]',
          citation JSONB DEFAULT '[]',
          feedback JSONB,
          more JSONB DEFAULT '{}',
          annotation JSONB,
          is_opening_statement BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (msgError && !msgError.message.includes('already exists')) {
      console.error('创建 messages 表失败:', msgError.message)
    } else {
      console.log('✅ messages 表创建成功')
    }

    // 4. 测试表是否创建成功
    console.log('\n🧪 测试表结构...')
    
    const { data: profiles, error: profilesTestError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (profilesTestError) {
      console.error('user_profiles 表测试失败:', profilesTestError.message)
    } else {
      console.log('✅ user_profiles 表可正常访问')
    }

    const { data: conversations, error: convTestError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)

    if (convTestError) {
      console.error('conversations 表测试失败:', convTestError.message)
    } else {
      console.log('✅ conversations 表可正常访问')
    }

    const { data: messages, error: msgTestError } = await supabase
      .from('messages')
      .select('count')
      .limit(1)

    if (msgTestError) {
      console.error('messages 表测试失败:', msgTestError.message)
    } else {
      console.log('✅ messages 表可正常访问')
    }

    console.log('\n🎉 数据库表创建完成!')
    
  } catch (error) {
    console.error('❌ 创建表时发生错误:', error.message)
  }
}

// 运行迁移
createChatTables()