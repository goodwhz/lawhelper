const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

const updates = [
  { title: '中华人民共和国劳动法', file_path: 'national-law/labor-law-20181229.pdf', file_type: '.pdf' },
  { title: '中华人民共和国劳动合同法', file_path: 'national-law/labor-contract-law-20121228.pdf', file_type: '.pdf' },
  { title: '中华人民共和国劳动合同法实施条例', file_path: 'national-law/labor-contract-law-regulations-20080918.pdf', file_type: '.pdf' },
  { title: '中华人民共和国劳动争议调解仲裁法', file_path: 'national-law/labor-dispute-mediation-arbitration-law-20071229.pdf', file_type: '.pdf' },
  { title: '中华人民共和国民法典', file_path: 'national-law/civil-code-20200528.pdf', file_type: '.pdf' },
  { title: '工人考核条例', file_path: 'national-administrative-regulations/worker-assessment-regulations-19900711.pdf', file_type: '.pdf' },
  { title: '工伤保险条例', file_path: 'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf', file_type: '.pdf' },
  { title: '劳动保障监察条例', file_path: 'national-administrative-regulations/labor-inspection-regulations-20041101.pdf', file_type: '.pdf' },
  { title: '劳动就业服务企业管理规定', file_path: 'national-administrative-regulations/labor-employment-service-management-regulations-19901122.pdf', file_type: '.pdf' },
  { title: '女职工劳动保护特别规定', file_path: 'national-administrative-regulations/female-worker-protection-special-regulations-20120428.pdf', file_type: '.pdf' },
  { title: '使用有毒物品作业场所劳动保护条例', file_path: 'national-administrative-regulations/hazardous-materials-workplace-protection-regulations-20241206.pdf', file_type: '.pdf' },
]

async function updateDatabase() {
  console.log('🔄 开始更新数据库记录...')
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < updates.length; i++) {
    try {
      const { error } = await supabase
        .from('law_documents')
        .update({
          file_path: updates[i].file_path,
          file_type: updates[i].file_type,
        })
        .eq('title', updates[i].title)

      if (error) {
        console.log('⚠️  更新失败:', updates[i].title, error.message)
        failCount++
      } else {
        console.log('✅ 更新成功:', updates[i].title)
        successCount++
      }
    } catch (err) {
      console.log('❌ 异常:', updates[i].title, err.message)
      failCount++
    }

    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200))

    if ((i + 1) % 3 === 0) {
      console.log(`📊 进度: ${i + 1}/${updates.length}`)
    }
  }

  console.log(`\n🎉 更新完成! 成功: ${successCount}, 失败: ${failCount}`)
}

updateDatabase()
