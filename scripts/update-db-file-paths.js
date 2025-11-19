const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 读取文件映射表
const fileMapping = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'file-mapping.json'),
  'utf8',
))

// 主函数
async function updateFilePaths() {
  try {
    console.log('🚀 开始更新数据库中的文件路径...')

    // 获取所有法律文档
    const { data: documents, error: getError } = await supabase
      .from('law_documents')
      .select('id, title, file_path')

    if (getError) {
      console.error('获取文档失败:', getError)
      return
    }

    console.log(`📄 找到 ${documents.length} 条法律文档记录`)

    let updateCount = 0
    let skipCount = 0

    // 更新每条记录的文件路径
    for (const doc of documents) {
      // 获取原始文件名
      let originalFileName = ''

      if (doc.file_path) {
        // 从路径中提取文件名
        const pathParts = doc.file_path.split('/')
        if (pathParts.length > 1) {
          originalFileName = pathParts[pathParts.length - 1]
        } else {
          originalFileName = path.basename(doc.file_path)
        }
      }

      // 查找映射的新路径
      const newPath = fileMapping[originalFileName]

      if (newPath) {
        // 更新文件路径
        const { error: updateError } = await supabase
          .from('law_documents')
          .update({ file_path: newPath })
          .eq('id', doc.id)

        if (updateError) {
          console.error(`❌ 更新失败 "${doc.title}":`, updateError.message)
        } else {
          console.log(`✅ 更新成功 "${doc.title}"`)
          console.log(`   原路径: ${doc.file_path}`)
          console.log(`   新路径: ${newPath}`)
          updateCount++
        }
      } else {
        console.log(`⚠️ 跳过 "${doc.title}" - 无映射文件`)
        skipCount++
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n🎉 更新完成!')
    console.log(`✅ 成功更新: ${updateCount} 条记录`)
    console.log(`⚠️ 跳过: ${skipCount} 条记录`)

    // 验证更新结果
    console.log('\n🔍 验证更新结果...')
    const { data: updatedDocs } = await supabase
      .from('law_documents')
      .select('title, file_path')
      .limit(10)

    console.log('更新后的文件路径示例:')
    updatedDocs.forEach((doc) => {
      console.log(`- ${doc.title}: ${doc.file_path}`)
    })
  } catch (error) {
    console.error('❌ 更新过程发生错误:', error)
  }
}

// 运行脚本
updateFilePaths()
