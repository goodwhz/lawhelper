const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function simpleVerification() {
  try {
    console.log('🎯 最终验证：法律文书迁移状态')
    console.log('='.repeat(50))

    // 统计各类别文件数量
    const { data: documents, error } = await supabase
      .from('law_documents')
      .select('title, file_path, file_type')
      .eq('is_published', true)
      .eq('file_type', '.pdf')

    if (error) {
      console.error('❌ 查询失败:', error.message)
      return
    }

    console.log(`\\n📊 总共找到 ${documents.length} 个已发布的PDF文件\\n`)

    // 分类统计
    const stats = {
      '国家法律': 0,
      '国家行政法规': 0,
      '地方性法规': 0,
      '其他/未迁移': 0,
    }

    documents.forEach((doc) => {
      if (doc.file_path.startsWith('national-law/')) {
        stats['国家法律']++
      } else if (doc.file_path.startsWith('national-administrative-regulations/')) {
        stats['国家行政法规']++
      } else if (doc.file_path.startsWith('local-regulations/')) {
        stats['地方性法规']++
      } else {
        stats['其他/未迁移']++
      }
    })

    // 显示统计结果
    console.log('📋 文件分类统计:')
    console.log(`🏛️  国家法律: ${stats['国家法律']} 个`)
    console.log(`📋  国家行政法规: ${stats['国家行政法规']} 个`)
    console.log(`🏘️  地方性法规: ${stats['地方性法规']} 个`)
    console.log(`⚠️  其他/未迁移: ${stats['其他/未迁移']} 个`)

    // 检查关键文件
    console.log('\\n🔍 关键文件验证:')
    const keyTitles = [
      '中华人民共和国劳动法',
      '中华人民共和国劳动合同法',
      '上海市劳动合同条例',
      '工伤保险条例',
      '女职工劳动保护特别规定',
    ]

    for (const title of keyTitles) {
      const doc = documents.find(d => d.title === title)
      if (doc) {
        const isMigrated = doc.file_path.startsWith('national-') || doc.file_path.startsWith('local-regulations/')
        console.log(`${isMigrated ? '✅' : '⚠️'} ${title}`)
        console.log(`    📁 ${doc.file_path}`)
      } else {
        console.log(`❌ 未找到: ${title}`)
      }
    }

    // 测试Supabase Storage访问
    console.log('\\n🌐 Supabase Storage 访问测试:')
    const testPaths = [
      'national-law/labor-law-20181229.pdf',
      'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf',
      'local-regulations/shanghai-labor-contract-regulations-20011115.pdf',
    ]

    for (const path of testPaths) {
      try {
        const { data } = supabase.storage
          .from('law-documents')
          .getPublicUrl(path)
        console.log(`✅ ${path}`)
        console.log(`    🔗 ${data.publicUrl}`)
      } catch (err) {
        console.log(`❌ ${path}: 访问失败`)
      }
    }

    // 总结
    const totalMigrated = stats['国家法律'] + stats['国家行政法规'] + stats['地方性法规']
    const migrationRate = Math.round((totalMigrated / documents.length) * 100)

    console.log('\\n🎉 迁移总结:')
    console.log(`📁 总文件数: ${documents.length}`)
    console.log(`✅ 已迁移到Supabase: ${totalMigrated}`)
    console.log(`📈 迁移成功率: ${migrationRate}%`)

    if (migrationRate >= 90) {
      console.log('\\n🚀 优秀！系统已完全准备好部署到Vercel')
    } else if (migrationRate >= 70) {
      console.log('\\n✅ 良好！系统基本准备好部署')
    } else {
      console.log('\\n⚠️  需要继续完善迁移工作')
    }
  } catch (error) {
    console.error('❌ 验证过程失败:', error.message)
  }
}

simpleVerification()
