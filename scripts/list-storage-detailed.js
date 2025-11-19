const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function listAllStorageFiles() {
  try {
    console.log('🗂️ 详细检查Supabase Storage内容...\n')

    // 递归获取所有文件
    async function getAllFiles(path = '') {
      const { data: items, error } = await supabase.storage
        .from('law-documents')
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error(`❌ 获取 ${path || '根目录'} 失败:`, error)
        return []
      }

      const files = []

      console.log(`📁 ${path || '根目录'}: ${items.length} 个项目`)

      for (const item of items || []) {
        if (item.id && !item.name.endsWith('/')) {
          // 这是一个文件
          console.log(`  📄 ${item.name} (${item.id})`)
          files.push({ ...item, fullPath: path + item.name })
        } else if (item.name.endsWith('/')) {
          // 这是一个文件夹，递归获取其内容
          console.log(`  📁 ${item.name} (文件夹)`)
          const subFiles = await getAllFiles(item.name)
          files.push(...subFiles)
        }
      }

      return files
    }

    const allFiles = await getAllFiles()

    console.log(`\n📊 总计找到 ${allFiles.length} 个文件`)

    if (allFiles.length === 0) {
      console.log('\n❌ Storage中没有文件！')
      console.log('💡 建议解决方案:')
      console.log('1. 检查文件是否已上传到Storage')
      console.log('2. 检查Storage权限设置')
      console.log('3. 重新上传文件到Storage')
    }

    return allFiles
  } catch (error) {
    console.error('❌ 列出Storage文件失败:', error)
    return []
  }
}

// 检查数据库中的文件路径是否正确
async function checkDatabasePaths() {
  try {
    console.log('\n🔍 检查数据库中的文件路径...')

    const { data: docs } = await supabase
      .from('law_documents')
      .select('id, title, file_path')
      .not('file_path', 'is', null)
      .limit(10)

    console.log('\n📋 数据库前10条记录:')
    docs.forEach((doc) => {
      console.log(`  ${doc.title}: ${doc.file_path}`)
    })

    // 检查路径格式
    const validSupabasePaths = docs.filter(doc =>
      doc.file_path && (
        doc.file_path.startsWith('local-regulations/')
        || doc.file_path.startsWith('national-law/')
        || doc.file_path.startsWith('national-administrative-regulations/')
      ),
    )

    console.log(`\n✅ Supabase格式路径: ${validSupabasePaths.length} 个`)
    console.log(`❌ 非Supabase格式路径: ${docs.length - validSupabasePaths.length} 个`)
  } catch (error) {
    console.error('❌ 检查数据库路径失败:', error)
  }
}

async function main() {
  const storageFiles = await listAllStorageFiles()
  await checkDatabasePaths()

  if (storageFiles.length === 0) {
    console.log('\n🚨 问题诊断:')
    console.log('数据库中有文件记录，但Supabase Storage中没有实际文件')
    console.log('这解释了为什么PDF无法下载和预览')
  }
}

main()
