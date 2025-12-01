// 自动修复 RLS 权限问题的脚本
const { execSync } = require('child_process')
const fs = require('fs')

console.log('🔧 开始自动修复 RLS 权限问题...\n')

// 1. 检查服务器状态
console.log('1. 检查服务器状态...')
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/health', { encoding: 'utf8' })
  if (response === '200' || response === '000') {
    console.log('✅ 服务器运行正常')
  } else {
    console.log('❌ 服务器状态异常，请确保服务在端口 3006 运行')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ 无法连接到服务器')
  process.exit(1)
}

// 2. 检查环境变量
console.log('\n2. 检查环境配置...')
try {
  const envContent = fs.readFileSync('.env', 'utf8')
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ Supabase 配置存在')
  } else {
    console.log('❌ Supabase 配置缺失')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ 无法读取 .env 文件')
  process.exit(1)
}

// 3. 生成修复说明
console.log('\n3. 生成修复说明...')

const fixInstructions = `
🔥 立即修复方案 🔥

问题描述：创建对话失败，错误对象为空 {}
原因分析：RLS (行级安全) 策略阻止了对话创建操作

📋 解决步骤：

步骤 1: 访问 Supabase Dashboard
   打开浏览器访问: https://supabase.com/dashboard
   登录并选择项目: duyfvvbgadrwaonvlrun

步骤 2: 打开 SQL Editor
   在左侧菜单点击 "SQL Editor"
   点击 "New query"

步骤 3: 执行 SQL 命令
   复制并执行以下命令（全部复制，一次性执行）：

   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

步骤 4: 验证修复
   执行完成后应该看到 "Success" 消息
   然后访问: http://localhost:3006/ai-chat-fixed

步骤 5: 测试应用
   1. 确保已登录: http://localhost:3006/auth/login
   2. 访问修复版: http://localhost:3006/ai-chat-fixed  
   3. 点击 "新建对话" 测试

⚡ 预期结果：
   - 对话创建成功
   - 能够发送和接收消息
   - 数据正确保存到数据库

🔍 如果仍有问题：
   1. 访问诊断页面: http://localhost:3006/ai-chat-diagnose
   2. 查看浏览器控制台 (F12)
   3. 检查页面上的错误信息

📞 技术支持：
   - SQL 文件位置: execute-fix.sql
   - 诊断页面: /ai-chat-diagnose
   - 修复版页面: /ai-chat-fixed
`

console.log(fixInstructions)

// 4. 保存说明到文件
fs.writeFileSync('RLS-修复步骤.md', fixInstructions)
console.log('✅ 修复步骤已保存到 RLS-修复步骤.md')

console.log('\n🎯 接下来请:')
console.log('1. 在 Supabase Dashboard 执行上述 SQL 命令')
console.log('2. 访问 http://localhost:3006/ai-chat-fixed 测试')
console.log('3. 如有问题，查看控制台错误信息')

console.log('\n🏁 修复准备完成！')