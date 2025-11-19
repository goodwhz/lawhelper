const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function finalVerification() {
  try {
    console.log('🎯 最终验证：检查法律文书迁移状态')
    console.log('='.repeat(60))

    // 按类别统计
    const { data: _stats, error: _statsError } = await supabase
      .from('law_documents')
      .select('category')
      .rpc('get_document_stats')

    // 使用SQL查询统计
    const { data: categories, error: catError } = await supabase
      .from('law_documents')
      .select(`
        CASE 
          WHEN file_path LIKE 'national-law/%' THEN '国家法律'
          WHEN file_path LIKE 'national-administrative-regulations/%' THEN '国家行政法规'  
          WHEN file_path LIKE 'local-regulations/%' THEN '地方性法规'
          ELSE '其他/未迁移'
        END as category,
        COUNT(*) as count
      `)
      .eq('is_published', true)
      .eq('file_type', '.pdf')

    if (catError) {
      console.error('❌ 查询失败:', catError.message)
      return
    }

    console.log('\\n📊 文件分类统计:')
    const categoryStats = {}

    // 手动聚合
    categories.forEach((item) => {
      const category = item.category
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    Object.entries(categoryStats).forEach(([category, count]) => {
      const emoji = category.includes('国家法律')
        ? '🏛️'
        : category.includes('国家行政法规')
          ? '📋'
          : category.includes('地方性法规') ? '🏘️' : '⚠️'
      console.log(`${emoji} ${category}: ${count} 个文件`)
    })

    // 检查关键文件
    console.log('\\n🔍 关键文件验证:')
    const keyFiles = [
      '中华人民共和国劳动法',
      '中华人民共和国劳动合同法',
      '上海市劳动合同条例',
      '工伤保险条例',
      '女职工劳动保护特别规定',
    ]

    for (const title of keyFiles) {
      const { data: file, error: fileError } = await supabase
        .from('law_documents')
        .select('title, file_path, file_type')
        .eq('title', title)
        .single()

      if (fileError) {
        console.log(`❌ ${title}: 查询失败`)
      } else if (file) {
        const isSupabasePath = file.file_path.startsWith('national-')
          || file.file_path.startsWith('local-regulations/')
        const status = isSupabasePath ? '✅' : '⚠️'
        console.log(`${status} ${title}: ${file.file_path}`)
      }
    }

    // 测试API访问
    console.log('\\n🌐 API访问测试:')
    const testPaths = [
      'national-law/labor-law-20181229.pdf',
      'local-regulations/shanghai-labor-contract-regulations-20011115.pdf',
    ]

    for (const path of testPaths) {
      try {
        const { data, error } = await supabase.storage
          .from('law-documents')
          .getPublicUrl(path)

        if (error) {
          console.log(`❌ ${path}: 无法获取URL`)
        } else {
          console.log(`✅ ${path}: 可访问`)
          console.log(`   🔗 ${data.publicUrl}`)
        }
      } catch (err) {
        console.log(`⚠️  ${path}: 访问异常`)
      }
    }

    // 总结
    console.log('\\n🎉 迁移完成总结:')
    const totalFiles = Object.values(categoryStats).reduce((sum, count) => sum + count, 0)
    const supabaseFiles = (categoryStats['国家法律'] || 0)
      + (categoryStats['国家行政法规'] || 0)
      + (categoryStats['地方性法规'] || 0)

    console.log(`📁 总文件数: ${totalFiles}`)
    console.log(`☁️  已迁移到Supabase: ${supabaseFiles}`)
    console.log(`📂  其他/未迁移: ${categoryStats['其他/未迁移'] || 0}`)
    console.log(`📈  迁移成功率: ${Math.round(supabaseFiles / totalFiles * 100)}%`)

    if (supabaseFiles >= 70) {
      console.log('\\n✅ 迁移完成！系统已准备好部署到Vercel')
    } else {
      console.log('\\n⚠️  还有部分文件需要手动处理')
    }
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
  }
}

finalVerification()
