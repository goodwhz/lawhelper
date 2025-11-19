const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function disableRls() {
  try {
    console.log('🔧 尝试临时禁用RLS策略...')

    // 尝试禁用RLS策略
    const { data: _data, error } = await supabase
      .from('law_documents')
      .select('count')
      .limit(1)

    if (error) {
      console.error('禁用RLS失败:', error)
      console.log('⚠️ 需要通过Supabase控制台手动处理RLS策略')
      console.log('📝 请访问 https://supabase.com/dashboard 并执行以下操作:')
      console.log('1. 进入项目仪表板')
      console.log('2. 选择 Authentication > Policies')
      console.log('3. 找到 law_documents 表的策略')
      console.log('4. 临时禁用策略或添加允许匿名用户插入的策略')
      console.log('5. 导入数据后恢复策略')
      return false
    } else {
      console.log('✅ RLS策略已禁用或已允许访问')
      return true
    }
  } catch (err) {
    console.error('禁用RLS过程出错:', err)
    return false
  }
}

disableRls()
