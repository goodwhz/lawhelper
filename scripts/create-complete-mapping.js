const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 读取现有的映射表
const existingMapping = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'file-mapping.json'),
  'utf8',
))

// 额外的映射表，处理数据库中存在但映射表中没有的文件
const additionalMapping = {
  '云南省劳动就业条例_': 'local-regulations/regulation-9e0cc016.pdf',
  '女职工劳动保护特别规定': 'national-administrative-regulations/female-worker-protection-regulation-2012-04-28.pdf',
  '云南省劳动监察条例': 'local-regulations/regulation-cd423d7a-2024-11-28.pdf',
  '云南省工会劳动法律监督条例': 'local-regulations/labor-law-2016-03-31.pdf',
  '宁波市劳动争议处理办法 (1)': 'local-regulations/labor-dispute-mediation-regulation-2002-01-10.pdf',
  '宁波市工会劳动保障法律监督条例': 'local-regulations/ningbo-labor-protection-legal-supervision-regulations-20061211.pdf',
  '安徽省劳动保护条例_': 'local-regulations/anhui-labor-protection-regulations.pdf',
  '山东省劳动人事争议调解仲裁条例': 'local-regulations/shandong-labor-personnel-dispute-mediation-arbitration-regulations-20170728.pdf',
  '山东省劳动合同条例': 'local-regulations/shandong-labor-contract-regulations-20130801.pdf',
  '山东省劳动和社会保障监察条例': 'local-regulations/shandong-labor-social-security-inspection-regulations-20201127.pdf',
  '山东省工会劳动法律监督条例': 'local-regulations/shandong-labor-legal-supervision-regulations-20210729.pdf',
  '山西省女职工劳动保护条例': 'local-regulations/shanxi-female-worker-protection-regulations-20150730.pdf',
  '常州市劳动教育促进条例': 'local-regulations/changzhou-labor-education-promotion-regulations-20230808.pdf',
  '广东省劳动保障监察条例': 'local-regulations/guangdong-labor-protection-inspection-regulations-20190521.pdf',
  '广东省工会劳动法律监督条例': 'national-administrative-regulations/labor-law-20001213.pdf',
  '广州市劳动关系三方协商规定': 'local-regulations/guangzhou-labor-relations-tripartite-consultation-regulations-20151223.pdf',
  '广西壮族自治区劳动人事争议调解仲裁条例+': 'local-regulations/guangxi-labor-personnel-dispute-mediation-arbitration-regulations-20231124.pdf',
  '抚顺市职工劳动权益保障条例': 'local-regulations/fushun-worker-rights-protection-regulations-20231124.pdf',
  '云南省职工劳动权益保障条例_': 'local-regulations/regulation-ddfcb831.pdf',
  '南昌市工会劳动法律监督条例_': 'local-regulations/labor-law.pdf',
  '合肥市劳动用工条例_': 'local-regulations/regulation-e3ab5002-2018-06-08.pdf',
  '合肥市工会劳动法律监督条例_': 'local-regulations/labor-law.pdf',
  '吉林省劳动保障监察条例_': 'local-regulations/labor-protection-inspection-regulation-2024-11-27.pdf',
  '吉林省劳动合同条例_': 'local-regulations/labor-contract-regulation-2024-11-27.pdf',
  '大连市劳动和社会保险监察条例_': 'local-regulations/dalian-labor-social-inspection-regulations.pdf',
  '天津市工会劳动法律监督条例': 'local-regulations/tianjin-labor-legal-supervision-regulations-20201201.pdf',
  '宁波市劳动争议处理办法': 'local-regulations/labor-dispute-mediation-regulation-2002-01-10.pdf',
  '新疆维吾尔自治区职工劳动权益保障条例_': 'local-regulations/regulation-20e99ac9.pdf',
  '无锡市工会劳动法律监督条例': 'local-regulations/wuxi-labor-legal-supervision-regulations-20061001.pdf',
  '昆明市工会劳动法律监督条例_': 'local-regulations/labor-law-2016-03-31.pdf',
  '杭州市工会劳动法律监督条例': 'local-regulations/hangzhou-labor-legal-supervision-regulations-20061228.pdf',
  '江苏省劳动合同条例': 'local-regulations/jiangsu-labor-contract-regulations-20130115.pdf',
  '江西省工会劳动法律监督条例': 'local-regulations/jiangxi-labor-law-supervision-regulations-20170525.pdf',
  '江西省劳动保障监察条例': 'local-regulations/jiangxi-labor-protection-inspection-regulations-20210728.pdf',
  '沈阳市劳动争议调解条例': 'local-regulations/shenyang-labor-dispute-mediation-regulations-20161212.pdf',
  '沈阳市工会劳动法律监督条例': 'local-regulations/shenyang-labor-legal-supervision-regulations-20051027.pdf',
  '河北省劳动和社会保障监察条例_': 'local-regulations/hebei-labor-social-security-inspection-regulations.pdf',
  '河北省工会劳动法律监督条例': 'local-regulations/hebei-labor-legal-supervision-regulations-20180727.pdf',
  '河南省劳动保障监察条例': 'local-regulations/henan-labor-protection-inspection-regulations-20100730.pdf',
  '河南省劳动保障监察条例 (1)': 'local-regulations/henan-labor-protection-inspection-regulations-20100730.pdf',
  '浙江省劳动人事争议调解仲裁条例': 'local-regulations/zhejiang-labor-personnel-dispute-mediation-arbitration-regulations-20200924.pdf',
  '浙江省劳动保障监察条例': 'local-regulations/zhejiang-labor-protection-inspection-regulations-20200924.pdf',
  '浙江省工会劳动法律监督条例': 'local-regulations/zhejiang-labor-legal-supervision-regulations-20160929.pdf',
  '海南省劳动保障监察若干规定': 'local-regulations/hainan-labor-protection-inspection-regulations-20230416.pdf',
  '深圳经济特区和谐劳动关系促进条例': 'local-regulations/shenzhen-sez-harmonious-labor-relations-promotion-regulations-20190426.pdf',
  '湖北省劳动和社会保障监察条例': 'local-regulations/hubei-labor-social-security-inspection-regulations-20040924.pdf',
  '湖北省工会劳动法律监督条例': 'local-regulations/hubei-labor-legal-supervision-regulations-20240926.pdf',
  '湖南省劳动保障监察条例': 'local-regulations/hunan-labor-protection-inspection-regulations-20220526.pdf',
  '湖南省工会劳动法律监督条例': 'local-regulations/hunan-labor-legal-supervision-regulations-20220926.pdf',
  '福建省女职工劳动保护条例': 'local-regulations/fujian-female-worker-protection-regulations-20200320.pdf',
  '福建省工会劳动法律监督条例': 'local-regulations/fujian-labor-legal-supervision-regulations-20170725.pdf',
  '贵阳市劳动保障监察条例': 'local-regulations/guiyang-labor-protection-inspection-regulations-20210607.pdf',
  '辽宁省劳动监察条例_': 'local-regulations/liaoning-labor-inspection-regulations.pdf',
  '辽宁省职工劳动权益保障条例_': 'local-regulations/liaoning-worker-labor-rights-protection-regulations-20190927.pdf',
  '郑州市劳动用工条例': 'local-regulations/zhengzhou-labor-employment-regulations-20120822.pdf',
  '陕西省劳动监察条例_': 'local-regulations/shaanxi-labor-inspection-regulations.pdf',
  '陕西省工会劳动法律监督条例': 'local-regulations/shaanxi-labor-legal-supervision-regulations-20240927.pdf',
  '青岛市劳动保障监察条例': 'local-regulations/qingdao-labor-protection-inspection-regulations-20220121.pdf',
  '青海省劳动保障监察条例': 'local-regulations/qinghai-labor-protection-inspection-regulations-20200722.pdf',
  '青海省劳动保障监察条例 (1)': 'local-regulations/qinghai-labor-protection-inspection-regulations-20200722.pdf',
  '鞍山市劳动争议调解条例_': 'local-regulations/anshan-labor-dispute-mediation-regulations.pdf',
  '黑龙江省女职工劳动保护条例': 'local-regulations/heilongjiang-female-worker-protection-regulations-20210823.pdf',
  '内蒙古自治区工会劳动法律监督条例_': 'local-regulations/labor-law-2021-03-30.pdf',
  '包头市劳动者工资保障条例_': 'local-regulations/regulation-419cd4cd.pdf',
  '厦门经济特区劳动管理规定_': 'local-regulations/regulation-de23c6ec-2010-07-29.pdf',
  '哈尔滨市劳动保障监察条例_': 'local-regulations/labor-protection-inspection-regulation-2020-10-23.pdf',
  '哈尔滨市寒冷季节室外劳动保护规定_': 'local-regulations/regulation-cc842b2d-2021-08-25.pdf',
  '宁夏回族自治区劳动保障监察条例_': 'local-regulations/ningxia-labor-protection-inspection-regulations.pdf',
  '宁夏回族自治区劳动合同条例+_': 'local-regulations/regulation-2e378b9c-2005-03-25.pdf',
  '江苏省工会劳动法律监督条例': 'local-regulations/jiangsu-labor-legal-supervision-regulations-20000731.pdf',
}

// 合并映射表
const completeMapping = { ...existingMapping, ...additionalMapping }

// 主函数
async function updateAllFilePaths() {
  try {
    console.log('🚀 开始更新所有数据库文件路径...')

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
      const newPath = completeMapping[originalFileName]

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
        console.log(`   当前路径: ${doc.file_path}`)
        skipCount++
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n🎉 更新完成!')
    console.log(`✅ 成功更新: ${updateCount} 条记录`)
    console.log(`⚠️ 跳过: ${skipCount} 条记录`)

    // 保存完整映射表
    fs.writeFileSync(
      path.join(__dirname, 'complete-mapping.json'),
      JSON.stringify(completeMapping, null, 2),
    )

    console.log('\n📋 完整映射表已保存到 complete-mapping.json')
  } catch (error) {
    console.error('❌ 更新过程发生错误:', error)
  }
}

// 运行脚本
updateAllFilePaths()
