const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function listFiles() {
  try {
    console.log('📋 Supabase Storage 中的法律文书:')
    console.log('='.repeat(60))

    // 手动列出我们上传的文件
    const uploadedFiles = [
      'national-law/labor-law-20181229.pdf',
      'national-law/labor-contract-law-20121228.pdf',
      'national-law/labor-contract-law-regulations-20080918.pdf',
      'national-law/labor-dispute-mediation-arbitration-law-20071229.pdf',
      'national-law/civil-code-20200528.pdf',
      'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf',
      'national-administrative-regulations/labor-inspection-regulations-20041101.pdf',
      'national-administrative-regulations/female-worker-protection-regulations-20120428.pdf',
      'national-administrative-regulations/hazardous-materials-workplace-protection-regulations-20241206.pdf',
    ]

    console.log('找到 9 个上传的文件:\\n')

    // 按类别分组
    const categories = {
      'national-law': '国家法律',
      'national-administrative-regulations': '国家行政法规',
    }

    const _totalSize = 0

    Object.entries(categories).forEach(([categoryKey, categoryZh]) => {
      const categoryFiles = uploadedFiles.filter(file => file.startsWith(categoryKey))
      if (categoryFiles.length > 0) {
        console.log(`📁 ${categoryZh} (${categoryKey}/)`)
        categoryFiles.forEach(async (filePath) => {
          try {
            // 尝试获取文件信息
            const { data: { publicUrl } } = supabase.storage
              .from('law-documents')
              .getPublicUrl(filePath)

            const fileName = filePath.split('/')[1]
            console.log(`  📄 ${fileName}`)
            console.log(`    🔗 ${publicUrl}`)
          } catch (_error) {
            console.log(`  📄 ${filePath.split('/')[1]} (链接获取失败)`)
          }
        })
        console.log('')
      }
    })

    console.log('🌐 API 访问方式:')
    console.log('本地测试: http://localhost:3000/api/law/{文件路径}')
    console.log('生产环境: https://your-domain.vercel.app/api/law/{文件路径}')
    console.log('')
    console.log('示例: /api/law/national-law/labor-law-20181229.pdf')
  } catch (error) {
    console.error('查询失败:', error.message)
  }
}

listFiles()
