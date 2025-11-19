const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 分批更新，每次10条
const updateBatches = [
  // 第一批 - 华东地区
  [
    { title: '安徽省工会劳动法律监督条例_20191223', path: 'local-regulations/anhui-labor-law-supervision-regulations-20191223.pdf' },
    { title: '安徽省劳动保护条例_', path: 'local-regulations/anhui-labor-protection-regulations.pdf' },
    { title: '上海市劳动合同条例', path: 'local-regulations/shanghai-labor-contract-regulations-20011115.pdf' },
    { title: '江苏省工会劳动法律监督条例_20200731', path: 'local-regulations/jiangsu-labor-law-supervision-regulations-20200731.pdf' },
    { title: '江苏省劳动合同条例_20130115', path: 'local-regulations/jiangsu-labor-contract-regulations-20130115.pdf' },
    { title: '浙江省工会劳动法律监督条例_20160929', path: 'local-regulations/zhejiang-labor-law-supervision-regulations-20160929.pdf' },
    { title: '浙江省劳动保障监察条例_20200924', path: 'local-regulations/zhejiang-labor-protection-inspection-regulations-20200924.pdf' },
    { title: '浙江省劳动人事争议调解仲裁条例_20200924', path: 'local-regulations/zhejiang-labor-personnel-dispute-mediation-arbitration-regulations-20200924.pdf' },
    { title: '江西省工会劳动法律监督条例_20170525', path: 'local-regulations/jiangxi-labor-law-supervision-regulations-20170525.pdf' },
    { title: '江西省劳动保障监察条例_20210728', path: 'local-regulations/jiangxi-labor-protection-inspection-regulations-20210728.pdf' },
  ],
  // 第二批 - 华北地区
  [
    { title: '北京市工会劳动法律监督条例_', path: 'local-regulations/beijing-labor-law-supervision-regulations.pdf' },
    { title: '天津市工会劳动法律监督条例_20201201', path: 'local-regulations/tianjin-labor-law-supervision-regulations-20201201.pdf' },
    { title: '天津市劳动和社会保障监察条例_20100925', path: 'local-regulations/tianjin-labor-social-inspection-regulations-20100925.pdf' },
    { title: '河北省工会劳动法律监督条例_20180727', path: 'local-regulations/hebei-labor-law-supervision-regulations-20180727.pdf' },
    { title: '河北省劳动和社会保障监察条例_', path: 'local-regulations/hebei-labor-social-inspection-regulations.pdf' },
    { title: '山西省劳动合同条例_20090224', path: 'local-regulations/shanxi-labor-contract-regulations-20090224.pdf' },
    { title: '山西省女职工劳动保护条例_20150730', path: 'local-regulations/shanxi-female-worker-protection-regulations-20150730.pdf' },
    { title: '内蒙古自治区工会劳动法律监督条例_20210330', path: 'local-regulations/inner-mongolia-labor-law-supervision-regulations-20210330.pdf' },
    { title: '内蒙古自治区劳动保障监察条例_20100325', path: 'local-regulations/inner-mongolia-labor-protection-inspection-regulations-20100325.pdf' },
  ],
  // 第三批 - 东北地区
  [
    { title: '辽宁省劳动监察条例_', path: 'local-regulations/liaoning-labor-inspection-regulations.pdf' },
    { title: '辽宁省职工劳动权益保障条例_20190927', path: 'local-regulations/liaoning-worker-labor-rights-protection-regulations-20190927.pdf' },
    { title: '吉林省劳动保障监察条例_20241127', path: 'local-regulations/jilin-labor-protection-inspection-regulations-20241127.pdf' },
    { title: '吉林省劳动合同条例_20241127', path: 'local-regulations/jilin-labor-contract-regulations-20241127.pdf' },
    { title: '黑龙江省劳动保障监察条例_20180628', path: 'local-regulations/heilongjiang-labor-protection-inspection-regulations-20180628.pdf' },
    { title: '黑龙江省劳动力市场管理条例_20180628', path: 'local-regulations/heilongjiang-labor-market-management-regulations-20180628.pdf' },
    { title: '黑龙江省女职工劳动保护条例_20210823', path: 'local-regulations/heilongjiang-female-worker-protection-regulations-20210823.pdf' },
  ],
  // 第四批 - 华中地区
  [
    { title: '河南省劳动保障监察条例_20100730', path: 'local-regulations/henan-labor-protection-inspection-regulations-20100730.pdf' },
    { title: '湖北省工会劳动法律监督条例_20240926', path: 'local-regulations/hubei-labor-law-supervision-regulations-20240926.pdf' },
    { title: '湖北省劳动和社会保障监察条例_20040924', path: 'local-regulations/hubei-labor-social-inspection-regulations-20040924.pdf' },
    { title: '湖南省工会劳动法律监督条例_20220926', path: 'local-regulations/hunan-labor-law-supervision-regulations-20220926.pdf' },
    { title: '湖南省劳动保障监察条例_20220526', path: 'local-regulations/hunan-labor-protection-inspection-regulations-20220526.pdf' },
    { title: '陕西省工会劳动法律监督条例_20240927', path: 'local-regulations/shaanxi-labor-law-supervision-regulations-20240927.pdf' },
    { title: '陕西省劳动监察条例_', path: 'local-regulations/shaanxi-labor-inspection-regulations.pdf' },
  ],
  // 第五批 - 华南地区
  [
    { title: '广东省工会劳动法律监督条例_20001213', path: 'local-regulations/guangdong-labor-law-supervision-regulations-20001213.pdf' },
    { title: '广东省劳动保障监察条例_20190521', path: 'local-regulations/guangdong-labor-protection-inspection-regulations-20190521.pdf' },
    { title: '广西壮族自治区劳动人事争议调解仲裁条例+_20231124', path: 'local-regulations/guangxi-labor-personnel-dispute-mediation-arbitration-regulations-20231124.pdf' },
    { title: '海南省劳动保障监察若干规定_20230416', path: 'local-regulations/hainan-labor-protection-inspection-provisions-20230416.pdf' },
    { title: '重庆市劳动保障监察条例_20220928', path: 'local-regulations/chongqing-labor-protection-inspection-regulations-20220928.pdf' },
    { title: '四川省劳动和社会保障监察条例_20180726', path: 'local-regulations/sichuan-labor-social-inspection-regulations-20180726.pdf' },
    { title: '贵州省劳动保障监察条例_', path: 'local-regulations/guizhou-labor-protection-inspection-regulations.pdf' },
    { title: '云南省工会劳动法律监督条例_20160331', path: 'local-regulations/yunnan-labor-law-supervision-regulations-20160331.pdf' },
    { title: '云南省劳动监察条例_20241128', path: 'local-regulations/yunnan-labor-inspection-regulations-20241128.pdf' },
    { title: '云南省劳动就业条例_', path: 'local-regulations/yunnan-labor-employment-regulations.pdf' },
  ],
  // 第六批 - 西北地区
  [
    { title: '陕西省劳动监察条例_', path: 'local-regulations/shaanxi-labor-inspection-regulations.pdf' },
    { title: '甘肃省劳动保障监察条例_', path: 'local-regulations/gansu-labor-protection-inspection-regulations.pdf' },
    { title: '青海省劳动保障监察条例_20200722', path: 'local-regulations/qinghai-labor-protection-inspection-regulations-20200722.pdf' },
    { title: '宁夏回族自治区劳动保障监察条例_', path: 'local-regulations/ningxia-labor-protection-inspection-regulations.pdf' },
    { title: '宁夏回族自治区劳动合同条例+_20050325', path: 'local-regulations/ningxia-labor-contract-regulations-20050325.pdf' },
    { title: '新疆维吾尔自治区职工劳动权益保障条例_', path: 'local-regulations/xinjiang-worker-labor-rights-protection-regulations.pdf' },
  ],
  // 第七批 - 重点城市
  [
    { title: '深圳市经济特区和谐劳动关系促进条例_20190426', path: 'local-regulations/shenzhen-sez-harmonious-labor-relations-promotion-regulations-20190426.pdf' },
    { title: '广州市劳动关系三方协商规定_20151223', path: 'local-regulations/guangzhou-labor-relations-tripartite-consultation-regulations-20151223.pdf' },
    { title: '厦门市经济特区劳动管理规定_20100729', path: 'local-regulations/xiamen-sez-labor-management-regulations-20100729.pdf' },
    { title: '青岛市劳动保障监察条例_20220121', path: 'local-regulations/qingdao-labor-protection-inspection-regulations-20220121.pdf' },
    { title: '宁波市工会劳动保障法律监督条例_20061211', path: 'local-regulations/ningbo-labor-protection-law-supervision-regulations-20061211.pdf' },
    { title: '宁波市劳动争议处理办法_20020110', path: 'local-regulations/ningbo-labor-dispute-handling-methods-20020110.pdf' },
    { title: '郑州市劳动用工条例_20120822', path: 'local-regulations/zhengzhou-labor-employment-regulations-20120822.pdf' },
  ],
]

// 执行单批更新
async function updateBatch(batchNumber, batch) {
  try {
    console.log(`🔄 执行第 ${batchNumber} 批更新 (${batch.length} 条记录)...`)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < batch.length; i++) {
      const { title, path } = batch[i]

      try {
        const { error } = await supabase
          .from('law_documents')
          .update({
            file_path: path,
            file_type: '.pdf',
          })
          .eq('title', title)

        if (error) {
          console.error(`❌ 更新失败 ${title}:`, error.message)
          failCount++
        } else {
          console.log(`✅ 更新成功 ${title}`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ 异常 ${title}:`, err.message)
        failCount++
      }

      // 延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`✅ 第 ${batchNumber} 批完成: 成功 ${successCount}, 失败 ${failCount}`)
    return { successCount, failCount }
  } catch (error) {
    console.error(`❌ 第 ${batchNumber} 批执行失败:`, error.message)
    return { successCount: 0, failCount: batch.length }
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始批量更新地方性法规数据库记录...')

    let totalSuccess = 0
    let totalFail = 0

    // 逐批执行
    for (let i = 0; i < updateBatches.length; i++) {
      const batch = updateBatches[i]
      if (batch && batch.length > 0) {
        const { successCount, failCount } = await updateBatch(i + 1, batch)
        totalSuccess += successCount
        totalFail += failCount

        // 批间休息
        console.log('⏸️ 休息2秒...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\\n🎉 所有更新完成!')
    console.log(`✅ 总成功: ${totalSuccess} 条记录`)
    console.log(`❌ 总失败: ${totalFail} 条记录`)
  } catch (error) {
    console.error('❌ 批量更新失败:', error.message)
  }
}

main()
