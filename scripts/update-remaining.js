const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 需要更新的剩余文件映射
const remainingFiles = {
  '云南省劳动就业条例_': 'local-regulations/yunnan-labor-employment-regulations.pdf',
  '云南省工会劳动法律监督条例': 'local-regulations/yunnan-labor-law-supervision-regulations-20160331.pdf',
  '云南省职工劳动权益保障条例_': 'local-regulations/yunnan-worker-labor-rights-protection-regulations.pdf',
  '云南省劳动监察条例': 'local-regulations/yunnan-labor-inspection-regulations-20241128.pdf',
  '南昌市工会劳动法律监督条例_': 'local-regulations/nanchang-labor-law-supervision-regulations.pdf',
  '合肥市工会劳动法律监督条例_': 'local-regulations/hefei-labor-law-supervision-regulations.pdf',
  '合肥市劳动用工条例': 'local-regulations/hefei-labor-employment-regulations-20180608.pdf',
  '河北省工会劳动法律监督条例_20180727': 'local-regulations/hebei-labor-law-supervision-regulations-20180727.pdf',
  '河北省劳动和社会保障监察条例_': 'local-regulations/hebei-labor-social-inspection-regulations.pdf',
  '河南省劳动保障监察条例': 'local-regulations/henan-labor-protection-inspection-regulations-20100730.pdf',
  '黑龙江省劳动保障监察条例': 'local-regulations/heilongjiang-labor-protection-inspection-regulations-20180628.pdf',
  '黑龙江省劳动力市场管理条例': 'local-regulations/heilongjiang-labor-market-management-regulations-20180628.pdf',
  '黑龙江省女职工劳动保护条例': 'local-regulations/heilongjiang-female-worker-protection-regulations-20210823.pdf',
  '湖北省工会劳动法律监督条例': 'local-regulations/hubei-labor-law-supervision-regulations-20240926.pdf',
  '湖北省劳动和社会保障监察条例': 'local-regulations/hubei-labor-social-inspection-regulations-20040924.pdf',
  '湖南省工会劳动法律监督条例': 'local-regulations/hunan-labor-law-supervision-regulations-20220926.pdf',
  '湖南省劳动保障监察条例': 'local-regulations/hunan-labor-protection-inspection-regulations-20220526.pdf',
  '吉林省劳动保障监察条例': 'local-regulations/jilin-labor-protection-inspection-regulations-20241127.pdf',
  '吉林省劳动合同条例': 'local-regulations/jilin-labor-contract-regulations-20241127.pdf',
  '江苏省工会劳动法律监督条例': 'local-regulations/jiangsu-labor-law-supervision-regulations-20200731.pdf',
  '江苏省劳动合同条例': 'local-regulations/jiangsu-labor-contract-regulations-20130115.pdf',
  '江西省工会劳动法律监督条例': 'local-regulations/jiangxi-labor-law-supervision-regulations-20170525.pdf',
  '江西省劳动保障监察条例': 'local-regulations/jiangxi-labor-protection-inspection-regulations-20210728.pdf',
  '昆明市工会劳动法律监督条例_': 'local-regulations/kunming-labor-law-supervision-regulations.pdf',
  '辽宁省劳动监察条例_': 'local-regulations/liaoning-labor-inspection-regulations.pdf',
  '辽宁省职工劳动权益保障条例': 'local-regulations/liaoning-worker-labor-rights-protection-regulations-20190927.pdf',
  '内蒙古自治区工会劳动法律监督条例': 'local-regulations/inner-mongolia-labor-law-supervision-regulations-20210330.pdf',
  '内蒙古自治区劳动保障监察条例': 'local-regulations/inner-mongolia-labor-protection-inspection-regulations-20100325.pdf',
  '宁波市工会劳动保障法律监督条例': 'local-regulations/ningbo-labor-protection-law-supervision-regulations-20061211.pdf',
  '宁波市劳动争议处理办法': 'local-regulations/ningbo-labor-dispute-handling-methods-20020110.pdf',
  '宁夏回族自治区劳动保障监察条例_': 'local-regulations/ningxia-labor-protection-inspection-regulations.pdf',
  '宁夏回族自治区劳动合同条例+': 'local-regulations/ningxia-labor-contract-regulations-20050325.pdf',
  '青海省劳动保障监察条例': 'local-regulations/qinghai-labor-protection-inspection-regulations-20200722.pdf',
  '山西省劳动合同条例': 'local-regulations/shanxi-labor-contract-regulations-20090224.pdf',
  '山西省女职工劳动保护条例': 'local-regulations/shanxi-female-worker-protection-regulations-20150730.pdf',
  '陕西省工会劳动法律监督条例': 'local-regulations/shaanxi-labor-law-supervision-regulations-20240927.pdf',
  '陕西省劳动监察条例_': 'local-regulations/shaanxi-labor-inspection-regulations.pdf',
  '深圳经济特区和谐劳动关系促进条例': 'local-regulations/shenzhen-sez-harmonious-labor-relations-promotion-regulations-20190426.pdf',
  '沈阳市工会劳动法律监督条例': 'local-regulations/shenyang-labor-law-supervision-regulations-20051027.pdf',
  '沈阳市劳动争议调解条例': 'local-regulations/shenyang-labor-dispute-mediation-regulations-20161212.pdf',
  '四川省劳动和社会保障监察条例': 'local-regulations/sichuan-labor-social-inspection-regulations-20180726.pdf',
  '天津市工会劳动法律监督条例': 'local-regulations/tianjin-labor-law-supervision-regulations-20201201.pdf',
  '天津市劳动和社会保障监察条例': 'local-regulations/tianjin-labor-social-inspection-regulations-20100925.pdf',
  '无锡市工会劳动法律监督条例': 'local-regulations/wuxi-labor-law-supervision-regulations-20061001.pdf',
  '新疆维吾尔自治区职工劳动权益保障条例_': 'local-regulations/xinjiang-worker-labor-rights-protection-regulations.pdf',
  '徐州市工会劳动法律监督条例': 'local-regulations/xuzhou-labor-law-supervision-regulations-20220120.pdf',
  '银川市劳动保障监察条例': 'local-regulations/yinchuan-labor-protection-inspection-regulations-20111212.pdf',
  '浙江省工会劳动法律监督条例': 'local-regulations/zhejiang-labor-law-supervision-regulations-20160929.pdf',
  '浙江省劳动保障监察条例': 'local-regulations/zhejiang-labor-protection-inspection-regulations-20200924.pdf',
  '浙江省劳动人事争议调解仲裁条例': 'local-regulations/zhejiang-labor-personnel-dispute-mediation-arbitration-regulations-20200924.pdf',
  '郑州市劳动用工条例': 'local-regulations/zhengzhou-labor-employment-regulations-20120822.pdf',
  '广州市劳动关系三方协商规定': 'local-regulations/guangzhou-labor-relations-tripartite-consultation-regulations-20151223.pdf',
  '青岛市劳动保障监察条例': 'local-regulations/qingdao-labor-protection-inspection-regulations-20220121.pdf',
  '厦门市经济特区劳动管理规定': 'local-regulations/xiamen-sez-labor-management-regulations-20100729.pdf',
  '山东省工会劳动法律监督条例': 'local-regulations/shandong-labor-law-supervision-regulations-20210729.pdf',
  '山东省劳动合同条例': 'local-regulations/shandong-labor-contract-regulations-20130801.pdf',
  '山东省劳动和社会保障监察条例': 'local-regulations/shandong-labor-social-inspection-regulations-20201127.pdf',
  '山东省劳动人事争议调解仲裁条例': 'local-regulations/shandong-labor-personnel-dispute-mediation-arbitration-regulations-20170728.pdf',
  '广西壮族自治区劳动人事争议调解仲裁条例+': 'local-regulations/guangxi-labor-personnel-dispute-mediation-arbitration-regulations-20231124.pdf',
  '贵州省劳动保障监察条例_': 'local-regulations/guizhou-labor-protection-inspection-regulations.pdf',
  '重庆市劳动保障监察条例': 'local-regulations/chongqing-labor-protection-inspection-regulations-20220928.pdf',
  '广东省工会劳动法律监督条例': 'local-regulations/guangdong-labor-law-supervision-regulations-20001213.pdf',
  '广东省劳动保障监察条例': 'local-regulations/guangdong-labor-protection-inspection-regulations-20190521.pdf',
  '海南省劳动保障监察若干规定': 'local-regulations/hainan-labor-protection-inspection-provisions-20230416.pdf',
  '杭州市工会劳动法律监督条例': 'local-regulations/hangzhou-labor-law-supervision-regulations-20061228.pdf',
}

// 主函数
async function main() {
  try {
    console.log('🔄 更新剩余的地方性法规记录...')

    const entries = Object.entries(remainingFiles)
    let successCount = 0
    let failCount = 0

    // 分批处理
    for (let i = 0; i < entries.length; i++) {
      const [title, newPath] = entries[i]

      try {
        const { error } = await supabase
          .from('law_documents')
          .update({
            file_path: newPath,
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

      // 延迟
      await new Promise(resolve => setTimeout(resolve, 150))

      // 每10个显示进度
      if ((i + 1) % 10 === 0) {
        console.log(`🔄 进度: ${i + 1}/${entries.length}`)
      }
    }

    console.log('\\n🎉 更新完成!')
    console.log(`✅ 成功: ${successCount} 条`)
    console.log(`❌ 失败: ${failCount} 条`)
  } catch (error) {
    console.error('❌ 更新失败:', error.message)
  }
}

main()
