const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

const sqlStatements = [
  'UPDATE law_documents SET file_path = \'national-law/labor-law-20181229.pdf\', file_type = \'.pdf\' WHERE title = \'中华人民共和国劳动法\';',
  'UPDATE law_documents SET file_path = \'national-law/labor-contract-law-20121228.pdf\', file_type = \'.pdf\' WHERE title = \'中华人民共和国劳动合同法\';',
  'UPDATE law_documents SET file_path = \'national-law/labor-contract-law-regulations-20080918.pdf\', file_type = \'.pdf\' WHERE title = \'中华人民共和国劳动合同法实施条例\';',
  'UPDATE law_documents SET file_path = \'national-law/labor-dispute-mediation-arbitration-law-20071229.pdf\', file_type = \'.pdf\' WHERE title = \'中华人民共和国劳动争议调解仲裁法\';',
  'UPDATE law_documents SET file_path = \'national-law/civil-code-20200528.pdf\', file_type = \'.pdf\' WHERE title = \'中华人民共和国民法典\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/worker-assessment-regulations-19900711.pdf\', file_type = \'.pdf\' WHERE title = \'工人考核条例\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/work-injury-insurance-regulations-20101220.pdf\', file_type = \'.pdf\' WHERE title = \'工伤保险条例\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/labor-inspection-regulations-20041101.pdf\', file_type = \'.pdf\' WHERE title = \'劳动保障监察条例\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/labor-employment-service-management-regulations-19901122.pdf\', file_type = \'.pdf\' WHERE title = \'劳动就业服务企业管理规定_19901122\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/female-worker-protection-special-regulations-20120428.pdf\', file_type = \'.pdf\' WHERE title = \'女职工劳动保护特别规定\';',
  'UPDATE law_documents SET file_path = \'national-administrative-regulations/hazardous-materials-workplace-protection-regulations-20241206.pdf\', file_type = \'.pdf\' WHERE title = \'使用有毒物品作业场所劳动保护条例\';',
]

async function updateDatabase() {
  console.log('🔄 开始更新数据库记录...')
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < sqlStatements.length; i++) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sqlStatements[i] })
      if (error) {
        console.log('⚠️  SQL执行失败:', error.message)
        failCount++
      } else {
        console.log('✅ SQL执行成功:', `${sqlStatements[i].substring(0, 50)}...`)
        successCount++
      }
    } catch (err) {
      console.log('❌ 异常:', err.message)
      failCount++
    }

    if ((i + 1) % 5 === 0) {
      console.log(`📊 进度: ${i + 1}/${sqlStatements.length}`)
    }
  }

  console.log(`\n🎉 更新完成! 成功: ${successCount}, 失败: ${failCount}`)
}

updateDatabase()
