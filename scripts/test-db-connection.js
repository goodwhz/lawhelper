const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function testDatabaseConnection() {
  try {
    console.log('🔍 测试Supabase数据库连接...')

    // 测试数据库连接 - 查询表结构
    const { data: tables, error: tablesError } = await supabase
      .from('law_documents')
      .select('count')
      .limit(1)

    if (tablesError) {
      console.error('❌ 数据库连接失败:', tablesError)
      return false
    }

    console.log('✅ 数据库连接成功')

    // 检查PDF文件记录
    const { data: pdfFiles, error: pdfError } = await supabase
      .from('law_documents')
      .select('title, file_path, file_type, id')
      .ilike('file_path', '%.pdf')
      .limit(10)

    if (pdfError) {
      console.error('❌ 查询PDF文件失败:', pdfError)
      return false
    }

    console.log(`📄 找到 ${pdfFiles.length} 个PDF文件记录:`)
    pdfFiles.forEach((file) => {
      console.log(`  - ${file.title}`)
      console.log(`    路径: ${file.file_path}`)
      console.log(`    类型: ${file.file_type}`)
      console.log('')
    })

    return true
  } catch (error) {
    console.error('❌ 连接测试失败:', error)
    return false
  }
}

// 测试Supabase Storage
async function testStorageConnection() {
  try {
    console.log('🗂️ 测试Supabase Storage连接...')

    // 列出存储桶中的文件
    const { data: files, error } = await supabase.storage
      .from('law-documents')
      .list('', {
        limit: 10,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      console.error('❌ Storage连接失败:', error)
      return false
    }

    console.log('✅ Storage连接成功')
    console.log(`📁 找到 ${files.length} 个文件/文件夹:`)
    files.forEach((file) => {
      console.log(`  - ${file.name} (${file.id ? '文件' : '文件夹'})`)
    })

    return true
  } catch (error) {
    console.error('❌ Storage测试失败:', error)
    return false
  }
}

// 主函数
async function main() {
  console.log('🚀 开始测试连接状态...\n')

  const dbConnected = await testDatabaseConnection()
  console.log('')

  const storageConnected = await testStorageConnection()
  console.log('')

  if (dbConnected && storageConnected) {
    console.log('🎉 所有连接测试通过！')
  } else {
    console.log('❌ 存在连接问题，请检查配置')
  }
}

main()
