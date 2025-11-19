const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 分类ID映射
const categoryMap = {
  国家法律: 'eb7e7928-9029-4cce-843b-98d3551f495e',
  国家行政法规: 'd45b6300-fd05-4ff4-b25a-c603a7cf697b',
  地方性法规: '2f86b35e-208f-4b1d-ac2b-8bbf8242e05e',
  司法解释: '508d8ad3-6bf2-46cf-9949-2b62c2dbaa9e',
  部门规章: 'ac6e4305-0644-4f68-8fe2-53d73df3ee57',
}

// 主函数
async function importData() {
  try {
    console.log('🚀 开始导入法律文书数据...')

    // 读取JSON数据文件
    const dataPath = path.join(__dirname, '../administrative_laws_data.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const lawData = JSON.parse(rawData)

    console.log(`📄 准备导入 ${lawData.length} 条法律文书记录`)

    let successCount = 0
    let failCount = 0

    // 逐条处理数据
    for (const law of lawData) {
      try {
        // 解析文件路径
        let filePath = law.filePath
        if (filePath) {
          // 将本地路径转换为Supabase Storage路径
          if (filePath.includes('国家法律/')) {
            const fileName = path.basename(filePath).replace(/\.(docx?|pdf)$/, '.pdf')
            filePath = `national-law/${fileName}`
          } else if (filePath.includes('国家行政法规/')) {
            const fileName = path.basename(filePath).replace(/\.(docx?|pdf)$/, '.pdf')
            filePath = `national-administrative-regulations/${fileName}`
          } else if (filePath.includes('地方性法规/')) {
            const fileName = path.basename(filePath).replace(/\.(docx?|pdf)$/, '.pdf')
            filePath = `local-regulations/${fileName}`
          }
        }

        // 解析内容
        let content = ''
        try {
          const contentObj = JSON.parse(law.content)
          content = contentObj.text || ''
        } catch (e) {
          content = law.content || ''
        }

        // 获取分类ID
        const categoryId = categoryMap[law.documentType] || categoryMap['国家行政法规']

        // 构建数据库记录
        const record = {
          title: law.title,
          content: content.substring(0, 10000), // 限制内容长度
          category_id: categoryId,
          document_type: law.documentType || '国家行政法规',
          document_number: null,
          publish_date: law.publishDate || null,
          effective_date: null,
          expire_date: null,
          file_path: filePath,
          file_size: law.fileSize || null,
          file_type: '.pdf',
          download_count: 0,
          view_count: 0,
          is_published: true,
          is_featured: false,
          keywords: null,
          tags: null,
        }

        // 插入数据
        const { data, error } = await supabase
          .from('law_documents')
          .insert([record])
          .select()

        if (error) {
          console.error(`❌ 导入失败 "${law.title}":`, error.message)
          failCount++
        } else {
          console.log(`✅ 导入成功 "${law.title}"`)
          successCount++
        }

        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        console.error(`❌ 处理记录失败 "${law.title}":`, err.message)
        failCount++
      }
    }

    console.log('\n📊 导入完成!')
    console.log(`✅ 成功: ${successCount} 条记录`)
    console.log(`❌ 失败: ${failCount} 条记录`)

    if (successCount > 0) {
      console.log('\n🎯 数据已成功导入到 law_documents 表!')
    }
  } catch (error) {
    console.error('❌ 导入过程发生错误:', error)
  }
}

// 运行脚本
importData()
