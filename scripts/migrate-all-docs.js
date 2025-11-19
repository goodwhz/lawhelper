const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 文件路径映射（数据库标题 -> Supabase路径）
const dbToFileMap = {
  中华人民共和国劳动法: 'national-law/labor-law-20181229.pdf',
  中华人民共和国劳动合同法: 'national-law/labor-contract-law-20121228.pdf',
  中华人民共和国劳动合同法实施条例: 'national-law/labor-contract-law-regulations-20080918.pdf',
  中华人民共和国劳动争议调解仲裁法: 'national-law/labor-dispute-mediation-arbitration-law-20071229.pdf',
  中华人民共和国民法典: 'national-law/civil-code-20200528.pdf',
  工伤保险条例: 'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf',
  劳动保障监察条例: 'national-administrative-regulations/labor-inspection-regulations-20041101.pdf',
  女职工劳动保护特别规定: 'national-administrative-regulations/female-worker-protection-regulations-20120428.pdf',
  使用有毒物品作业场所劳动保护条例: 'national-administrative-regulations/hazardous-materials-workplace-protection-regulations-20241206.pdf',
}

// 上传文件到Supabase
async function uploadFile(localPath, supabasePath) {
  try {
    const fullPath = `e:\\Workplace\\AI\\PBL2\\lawhelper\\law\\${localPath}`

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  文件不存在: ${fullPath}`)
      return false
    }

    const fileBuffer = fs.readFileSync(fullPath)
    console.log(`📄 上传: ${localPath} -> ${supabasePath}`)

    const { data, error } = await supabase.storage
      .from('law-documents')
      .upload(supabasePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error(`❌ 上传失败 ${supabasePath}:`, error.message)
      return false
    }

    console.log(`✅ 上传成功 ${supabasePath}`)
    return true
  } catch (error) {
    console.error(`❌ 处理文件失败 ${localPath}:`, error.message)
    return false
  }
}

// 创建数据库更新语句
function generateUpdateSQL() {
  console.log('\\n📝 数据库更新SQL:')

  Object.entries(dbToFileMap).forEach(([title, supabasePath]) => {
    console.log(`UPDATE law_documents SET file_path = '${supabasePath}', file_type = '.pdf' WHERE title = '${title}';`)
  })
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始迁移法律文书到Supabase Storage...')

    // 定义文件映射（本地路径 -> Supabase路径）
    const fileMappings = [
      { local: '国家法律/中华人民共和国劳动法_20181229.pdf', supabase: 'national-law/labor-law-20181229.pdf' },
      { local: '国家法律/中华人民共和国劳动合同法_20121228.pdf', supabase: 'national-law/labor-contract-law-20121228.pdf' },
      { local: '国家法律/中华人民共和国劳动合同法实施条例_20080918.pdf', supabase: 'national-law/labor-contract-law-regulations-20080918.pdf' },
      { local: '国家法律/中华人民共和国劳动争议调解仲裁法_20071229.pdf', supabase: 'national-law/labor-dispute-mediation-arbitration-law-20071229.pdf' },
      { local: '国家法律/中华人民共和国民法典_20200528.pdf', supabase: 'national-law/civil-code-20200528.pdf' },
      { local: '国家行政法规/工伤保险条例_20101220.pdf', supabase: 'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf' },
      { local: '国家行政法规/劳动保障监察条例_20041101.pdf', supabase: 'national-administrative-regulations/labor-inspection-regulations-20041101.pdf' },
      { local: '国家行政法规/女职工劳动保护特别规定_20120428.pdf', supabase: 'national-administrative-regulations/female-worker-protection-regulations-20120428.pdf' },
      { local: '国家行政法规/使用有毒物品作业场所劳动保护条例_20241206.pdf', supabase: 'national-administrative-regulations/hazardous-materials-workplace-protection-regulations-20241206.pdf' },
    ]

    let successCount = 0
    let failCount = 0

    // 上传文件
    for (const mapping of fileMappings) {
      const success = await uploadFile(mapping.local, mapping.supabase)
      if (success) {
        successCount++
      } else {
        failCount++
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('\\n🎉 文件上传完成!')
    console.log(`✅ 成功: ${successCount} 个文件`)
    console.log(`❌ 失败: ${failCount} 个文件`)

    // 生成数据库更新语句
    generateUpdateSQL()

    console.log('\\n📋 迁移后，请运行上述SQL更新数据库记录')
    console.log('\\n🔗 所有文件将可通过以下URL格式访问:')
    console.log('   https://your-domain.vercel.app/api/law/{supabase-path}')
    console.log('   例如: /api/law/national-law/labor-law-20181229.pdf')
  } catch (error) {
    console.error('❌ 迁移过程发生错误:', error)
  }
}

main()
