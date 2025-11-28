const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function checkPDFStatus() {
  try {
    console.log('🔍 检查PDF文件状态...\n')

    // 查询所有有file_path的记录
    const { data: documents, error } = await supabase
      .from('law_documents')
      .select('id, title, file_path, file_type, file_size')
      .not('file_path', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 查询失败:', error)
      return
    }

    console.log(`📄 数据库中有 ${documents.length} 个文件记录:\n`)

    // 按路径类型分组
    const localFiles = []
    const supabaseFiles = []

    documents.forEach((doc) => {
      if (doc.file_path && doc.file_path.includes('\\')) {
        localFiles.push(doc)
      } else if (doc.file_path && (doc.file_path.startsWith('local-regulations/')
        || doc.file_path.startsWith('national-law/')
        || doc.file_path.startsWith('national-administrative-regulations/'))) {
        supabaseFiles.push(doc)
      } else {
        console.log(`⚠️ 未知路径格式: ${doc.title} -> ${doc.file_path}`)
      }
    })

    console.log(`🖥️ 本地文件路径: ${localFiles.length} 个`)
    localFiles.slice(0, 5).forEach((doc) => {
      console.log(`  - ${doc.title}`)
      console.log(`    路径: ${doc.file_path}`)
      console.log(`    大小: ${doc.file_size} bytes`)
      console.log('')
    })

    console.log(`☁️ Supabase路径: ${supabaseFiles.length} 个`)
    supabaseFiles.slice(0, 5).forEach((doc) => {
      console.log(`  - ${doc.title}`)
      console.log(`    路径: ${doc.file_path}`)
      console.log(`    大小: ${doc.file_size} bytes`)
      console.log('')
    })

    // 测试几个Supabase文件是否可以访问
    if (supabaseFiles.length > 0) {
      console.log('🧪 测试文件访问...')

      for (let i = 0; i < Math.min(3, supabaseFiles.length); i++) {
        const doc = supabaseFiles[i]
        console.log(`\n📋 测试文件: ${doc.title}`)
        console.log(`📁 路径: ${doc.file_path}`)

        try {
          const { data, error } = await supabase.storage
            .from('law-documents')
            .download(doc.file_path)

          if (error) {
            console.log(`❌ 下载失败: ${error.message}`)
          } else {
            console.log(`✅ 下载成功，大小: ${data.size} bytes`)

            // 检查是否是有效的PDF
            const buffer = Buffer.from(await data.arrayBuffer())
            const header = buffer.slice(0, 4).toString()
            if (header === '%PDF') {
              console.log('✅ 文件格式正确 (PDF)')
            } else {
              console.log(`❌ 文件格式错误，header: ${header}`)
            }
          }
        } catch (testError) {
          console.log(`❌ 测试失败: ${testError.message}`)
        }
      }
    }

    // 检查Storage中的实际文件
    console.log('\n🗂️ 检查Storage中的实际文件...')
    try {
      const { data: folders } = await supabase.storage
        .from('law-documents')
        .list('', {
          limit: 100,
        })

      console.log(`Storage中有 ${folders?.length || 0} 个顶级项目`)

      if (folders && folders.length > 0) {
        for (const folder of folders) {
          if (folder.name.endsWith('/')) {
            const { data: files } = await supabase.storage
              .from('law-documents')
              .list(folder.name, { limit: 10 })
            console.log(`📁 ${folder.name}: ${files?.length || 0} 个文件`)
          }
        }
      }
    } catch (e) {
      console.log(`❌ 检查Storage失败: ${e.message}`)
    }
  } catch (error) {
    console.error('❌ 检查过程出错:', error)
  }
}

checkPDFStatus()
