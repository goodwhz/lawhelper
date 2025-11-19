const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function listUploadedFiles() {
  try {
    console.log('📋 Supabase Storage 中的法律文书:')
    console.log('='.repeat(50))

    // 获取存储桶中的所有文件（递归）
    async function getAllFiles(path = '') {
      const { data: items, error } = await supabase.storage
        .from('law-documents')
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error('获取列表失败:', error.message)
        return []
      }

      const files = []

      for (const item of items || []) {
        if (item.id && !item.name.endsWith('/')) {
          // 这是一个文件
          files.push(item)
        } else if (item.name.endsWith('/')) {
          // 这是一个文件夹，递归获取其内容
          const subFiles = await getAllFiles(item.name)
          files.push(...subFiles)
        }
      }

      return files
    }

    const files = await getAllFiles()

    if (!files || files.length === 0) {
      console.log('没有找到文件')
      return
    }

    console.log(`找到 ${files.length} 个文件:\\n`)

    // 按类别分组显示
    const categories = {
      'national-law': '国家法律',
      'national-administrative-regulations': '国家行政法规',
      'local-regulations': '地方性法规',
    }

    const groupedFiles = {}

    files.forEach((file) => {
      const pathParts = file.name.split('/')
      const category = pathParts[0]
      const filename = pathParts[1]

      if (!groupedFiles[category]) {
        groupedFiles[category] = []
      }

      groupedFiles[category].push({
        name: filename,
        fullPath: file.name,
        size: file.metadata?.size || 0,
        created: file.created_at,
      })
    })

    // 显示每个类别的文件
    Object.entries(categories).forEach(([categoryKey, categoryZh]) => {
      const categoryFiles = groupedFiles[categoryKey]
      if (categoryFiles && categoryFiles.length > 0) {
        console.log(`📁 ${categoryZh} (${categoryKey}/)`)
        categoryFiles.forEach((file) => {
          const sizeKB = Math.round(file.size / 1024)
          console.log(`  📄 ${file.name} (${sizeKB}KB)`)
          const { data: { publicUrl } } = supabase.storage
            .from('law-documents')
            .getPublicUrl(file.fullPath)
          console.log(`    🔗 ${publicUrl}`)
        })
        console.log('')
      }
    })

    // 显示访问方式
    console.log('🌐 API 访问方式:')
    console.log('本地测试: http://localhost:3000/api/law/{文件路径}')
    console.log('生产环境: https://your-domain.vercel.app/api/law/{文件路径}')
    console.log('')
    console.log('示例: /api/law/national-law/labor-law-20181229.pdf')
  } catch (error) {
    console.error('查询失败:', error.message)
  }
}

listUploadedFiles()
