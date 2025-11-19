const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 地方性法规文件路径映射表
const localRegulationsMapping = {
  '安徽省工会劳动法律监督条例_20191223.pdf': 'local-regulations/anhui-labor-law-supervision-regulations-20191223.pdf',
  '安徽省劳动保护条例_.pdf': 'local-regulations/anhui-labor-protection-regulations.pdf',
  '鞍山市劳动争议调解条例_.pdf': 'local-regulations/anshan-labor-dispute-mediation-regulations.pdf',
  '包头市劳动者工资保障条例_.pdf': 'local-regulations/baotou-worker-wage-protection-regulations.pdf',
  '常州市劳动教育促进条例_20230808.pdf': 'local-regulations/changzhou-labor-education-promotion-regulations-20230808.pdf',
  '重庆市劳动保障监察条例_20220928.pdf': 'local-regulations/chongqing-labor-protection-inspection-regulations-20220928.pdf',
  '大连市劳动和社会保险监察条例_.pdf': 'local-regulations/dalian-labor-social-inspection-regulations.pdf',
  '福建省工会劳动法律监督条例_20170725.pdf': 'local-regulations/fujian-labor-law-supervision-regulations-20170725.pdf',
  '福建省女职工劳动保护条例_20200320.pdf': 'local-regulations/fujian-female-worker-protection-regulations-20200320.pdf',
  '抚顺市职工劳动权益保障条例_20231124.pdf': 'local-regulations/fushun-worker-labor-rights-protection-regulations-20231124.pdf',
  '广东省工会劳动法律监督条例_20001213.pdf': 'local-regulations/guangdong-labor-law-supervision-regulations-20001213.pdf',
  '广东省劳动保障监察条例_20190521.pdf': 'local-regulations/guangdong-labor-protection-inspection-regulations-20190521.pdf',
  '广西壮族自治区劳动人事争议调解仲裁条例+_20231124.pdf': 'local-regulations/guangxi-labor-personnel-dispute-mediation-arbitration-regulations-20231124.pdf',
  '广州市劳动关系三方协商规定_20151223.pdf': 'local-regulations/guangzhou-labor-relations-tripartite-consultation-regulations-20151223.pdf',
  '贵阳市劳动保障监察条例_20210607.pdf': 'local-regulations/guiyang-labor-protection-inspection-regulations-20210607.pdf',
  '哈尔滨市寒冷季节室外劳动保护规定_20210825.pdf': 'local-regulations/harbin-cold-season-outdoor-labor-protection-regulations-20210825.pdf',
  '哈尔滨市劳动保障监察条例_20201023.pdf': 'local-regulations/harbin-labor-protection-inspection-regulations-20201023.pdf',
  '海南省劳动保障监察若干规定_20230416.pdf': 'local-regulations/hainan-labor-protection-inspection-provisions-20230416.pdf',
  '杭州市工会劳动法律监督条例_20061228.pdf': 'local-regulations/hangzhou-labor-law-supervision-regulations-20061228.pdf',
  '合肥市工会劳动法律监督条例_.pdf': 'local-regulations/hefei-labor-law-supervision-regulations.pdf',
  '合肥市劳动用工条例_20180608.pdf': 'local-regulations/hefei-labor-employment-regulations-20180608.pdf',
  '河北省工会劳动法律监督条例_20180727.pdf': 'local-regulations/hebei-labor-law-supervision-regulations-20180727.pdf',
  '河北省劳动和社会保障监察条例_.pdf': 'local-regulations/hebei-labor-social-inspection-regulations.pdf',
  '河南省劳动保障监察条例_20100730.pdf': 'local-regulations/henan-labor-protection-inspection-regulations-20100730.pdf',
  '黑龙江省劳动保障监察条例_20180628.pdf': 'local-regulations/heilongjiang-labor-protection-inspection-regulations-20180628.pdf',
  '黑龙江省劳动力市场管理条例_20180628.pdf': 'local-regulations/heilongjiang-labor-market-management-regulations-20180628.pdf',
  '黑龙江省女职工劳动保护条例_20210823.pdf': 'local-regulations/heilongjiang-female-worker-protection-regulations-20210823.pdf',
  '湖北省工会劳动法律监督条例_20240926.pdf': 'local-regulations/hubei-labor-law-supervision-regulations-20240926.pdf',
  '湖北省劳动和社会保障监察条例_20040924.pdf': 'local-regulations/hubei-labor-social-inspection-regulations-20040924.pdf',
  '湖南省工会劳动法律监督条例_20220926.pdf': 'local-regulations/hunan-labor-law-supervision-regulations-20220926.pdf',
  '湖南省劳动保障监察条例_20220526.pdf': 'local-regulations/hunan-labor-protection-inspection-regulations-20220526.pdf',
  '吉林省劳动保障监察条例_20241127.pdf': 'local-regulations/jilin-labor-protection-inspection-regulations-20241127.pdf',
  '吉林省劳动合同条例_20241127.pdf': 'local-regulations/jilin-labor-contract-regulations-20241127.pdf',
  '江苏省工会劳动法律监督条例_20200731.pdf': 'local-regulations/jiangsu-labor-law-supervision-regulations-20200731.pdf',
  '江苏省劳动合同条例_20130115.pdf': 'local-regulations/jiangsu-labor-contract-regulations-20130115.pdf',
  '江西省工会劳动法律监督条例_20170525.pdf': 'local-regulations/jiangxi-labor-law-supervision-regulations-20170525.pdf',
  '江西省劳动保障监察条例_20210728.pdf': 'local-regulations/jiangxi-labor-protection-inspection-regulations-20210728.pdf',
  '昆明市工会劳动法律监督条例_.pdf': 'local-regulations/kunming-labor-law-supervision-regulations.pdf',
  '辽宁省劳动监察条例_.pdf': 'local-regulations/liaoning-labor-inspection-regulations.pdf',
  '辽宁省职工劳动权益保障条例_20190927.pdf': 'local-regulations/liaoning-worker-labor-rights-protection-regulations-20190927.pdf',
  '南昌市工会劳动法律监督条例_.pdf': 'local-regulations/nanchang-labor-law-supervision-regulations.pdf',
  '内蒙古自治区工会劳动法律监督条例_20210330.pdf': 'local-regulations/inner-mongolia-labor-law-supervision-regulations-20210330.pdf',
  '内蒙古自治区劳动保障监察条例_20100325.pdf': 'local-regulations/inner-mongolia-labor-protection-inspection-regulations-20100325.pdf',
  '宁波市工会劳动保障法律监督条例_20061211.pdf': 'local-regulations/ningbo-labor-protection-law-supervision-regulations-20061211.pdf',
  '宁波市劳动争议处理办法_20020110.pdf': 'local-regulations/ningbo-labor-dispute-handling-methods-20020110.pdf',
  '宁夏回族自治区劳动保障监察条例_.pdf': 'local-regulations/ningxia-labor-protection-inspection-regulations.pdf',
  '宁夏回族自治区劳动合同条例+_20050325.pdf': 'local-regulations/ningxia-labor-contract-regulations-20050325.pdf',
  '青岛市劳动保障监察条例_20220121.pdf': 'local-regulations/qingdao-labor-protection-inspection-regulations-20220121.pdf',
  '青海省劳动保障监察条例_20200722.pdf': 'local-regulations/qinghai-labor-protection-inspection-regulations-20200722.pdf',
  '厦门经济特区劳动管理规定_20100729.pdf': 'local-regulations/xiamen-sez-labor-management-regulations-20100729.pdf',
  '上海市劳动合同条例_20011115.pdf': 'local-regulations/shanghai-labor-contract-regulations-20011115.pdf',
  '深圳经济特区和谐劳动关系促进条例_20190426.pdf': 'local-regulations/shenzhen-sez-harmonious-labor-relations-promotion-regulations-20190426.pdf',
  '沈阳市工会劳动法律监督条例_20051027.pdf': 'local-regulations/shenyang-labor-law-supervision-regulations-20051027.pdf',
  '沈阳市劳动争议调解条例_20161212.pdf': 'local-regulations/shenyang-labor-dispute-mediation-regulations-20161212.pdf',
  '四川省劳动和社会保障监察条例_20180726.pdf': 'local-regulations/sichuan-labor-social-inspection-regulations-20180726.pdf',
  '天津市工会劳动法律监督条例_20201201.pdf': 'local-regulations/tianjin-labor-law-supervision-regulations-20201201.pdf',
  '天津市劳动和社会保障监察条例_20100925.pdf': 'local-regulations/tianjin-labor-social-inspection-regulations-20100925.pdf',
  '无锡市工会劳动法律监督条例_20061001.pdf': 'local-regulations/wuxi-labor-law-supervision-regulations-20061001.pdf',
  '新疆维吾尔自治区职工劳动权益保障条例_.pdf': 'local-regulations/xinjiang-worker-labor-rights-protection-regulations.pdf',
  '徐州市工会劳动法律监督条例_20220120.pdf': 'local-regulations/xuzhou-labor-law-supervision-regulations-20220120.pdf',
  '银川市劳动保障监察条例_20111212.pdf': 'local-regulations/yinchuan-labor-protection-inspection-regulations-20111212.pdf',
  '云南省工会劳动法律监督条例_20160331.pdf': 'local-regulations/yunnan-labor-law-supervision-regulations-20160331.pdf',
  '云南省劳动监察条例_20241128.pdf': 'local-regulations/yunnan-labor-inspection-regulations-20241128.pdf',
  '云南省劳动就业条例_.pdf': 'local-regulations/yunnan-labor-employment-regulations.pdf',
  '云南省职工劳动权益保障条例_.pdf': 'local-regulations/yunnan-worker-labor-rights-protection-regulations.pdf',
  '浙江省工会劳动法律监督条例_20160929.pdf': 'local-regulations/zhejiang-labor-law-supervision-regulations-20160929.pdf',
  '浙江省劳动保障监察条例_20200924.pdf': 'local-regulations/zhejiang-labor-protection-inspection-regulations-20200924.pdf',
  '浙江省劳动人事争议调解仲裁条例_20200924.pdf': 'local-regulations/zhejiang-labor-personnel-dispute-mediation-arbitration-regulations-20200924.pdf',
  '郑州市劳动用工条例_20120822.pdf': 'local-regulations/zhengzhou-labor-employment-regulations-20120822.pdf',
}

// 生成SQL更新语句
function generateUpdateSQL() {
  const sqlStatements = []

  Object.entries(localRegulationsMapping).forEach(([originalFile, supabasePath]) => {
    // 清理原始文件名，去除路径前缀
    const cleanFileName = originalFile.replace(/^.*[\\\/]/, '')
    const title = cleanFileName.replace(/\.pdf$/i, '')

    // 生成更新语句
    sqlStatements.push(`UPDATE law_documents SET file_path = '${supabasePath}', file_type = '.pdf' WHERE title = '${title}';`)
  })

  return sqlStatements
}

// 主函数
async function main() {
  try {
    console.log('🔄 生成地方性法规数据库更新SQL语句...')

    const sqlStatements = generateUpdateSQL()

    console.log(`\n📋 生成了 ${sqlStatements.length} 条更新语句:`)
    console.log('='.repeat(80))

    sqlStatements.forEach((sql, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ')
      console.log(`${lineNumber}. ${sql}`)
    })

    console.log('\n✅ 执行SQL更新...')
    let successCount = 0
    let failCount = 0

    // 执行更新（分批进行，避免超时）
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i]

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

        if (error) {
          // 备用方法：直接使用SQL语句（如果RPC不可用）
          console.log(`⚠️  RPC执行失败，将手动执行: ${sql.substring(0, 50)}...`)
        } else {
          successCount++
          if ((i + 1) % 10 === 0) {
            console.log(`✅ 已执行 ${i + 1}/${sqlStatements.length} 条语句`)
          }
        }
      } catch {
        console.log(`⚠️  语句 ${i + 1} 需要手动执行`)
        failCount++
      }
    }

    console.log('\n🎉 生成完成!')
    console.log(`✅ 成功: ${successCount} 条`)
    console.log(`❌ 失败: ${failCount} 条`)
    console.log('📝 请复制上述SQL语句到数据库管理工具中执行')
    console.log('\n💡 建议分批执行，每次10-15条语句，避免超时')
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
  }
}

main()
