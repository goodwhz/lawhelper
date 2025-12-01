import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    // 在实际环境中，这里会执行迁移脚本
    // 但由于权限问题，我们提供手动执行指导
    
    const instructions = `
## 创建删除对话函数的迁移步骤

### 方法1: 通过 Supabase Dashboard (推荐)

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目: duyfvvbgadrwaonvlrun
3. 进入 "SQL Editor"
4. 复制并执行 migrations/add_delete_function.sql 中的内容

### 方法2: 通过 CLI (需要已链接项目)

\`\`\`bash
npx supabase db push
\`\`\`

### 验证函数创建

执行以下查询验证：
\`\`\`sql
SELECT 
    proname as function_name,
    pg_get_userbyid(proowner) as owner
FROM pg_proc 
WHERE proname IN ('delete_conversation_with_messages', 'delete_multiple_conversations');
\`\`\`

### 如果删除函数仍不可用

API 端点会自动回退到直接删除方法，无需数据库函数。
`

    return NextResponse.json({
      message: '数据库函数迁移指导',
      instructions: instructions.trim(),
      note: 'API 端点已经更新为支持回退机制，即使没有数据库函数也能正常工作'
    })

  } catch (error) {
    console.error('Setup function error:', error)
    return NextResponse.json(
      { error: '设置失败' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '请发送 POST 请求来获取删除函数设置指导',
    status: 'API endpoint ready for fallback deletion'
  })
}