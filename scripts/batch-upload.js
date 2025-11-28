const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 文件名映射表（中文 -> 英文）
const fileNameMap = {
  // 国家法律
  '中华人民共和国劳动法_20181229.pdf': 'labor-law-20181229.pdf',
  '中华人民共和国劳动合同法_20121228.pdf': 'labor-contract-law-20121228.pdf',
  '中华人民共和国劳动合同法实施条例_20080918.pdf': 'labor-contract-law-regulations-20080918.pdf',
  '中华人民共和国劳动争议调解仲裁法_20071229.pdf': 'labor-dispute-mediation-arbitration-law-20071229.pdf',
  '中华人民共和国民法典_20200528.pdf': 'civil-code-20200528.pdf',

  // 国家行政法规
  '工伤保险条例_20101220.pdf': 'work-injury-insurance-regulations-20101220.pdf',
  '劳动保障监察条例_20041101.pdf': 'labor-inspection-regulations-20041101.pdf',
  '女职工劳动保护特别规定_20120428.pdf': 'female-worker-protection-regulations-20120428.pdf',
  '使用有毒物品作业场所劳动保护条例_20241206.pdf': 'hazardous-materials-workplace-protection-regulations-20241206.pdf',

  // 地方性法规
  '安徽省工会劳动法律监督条例_20191223.pdf': 'anhui-labor-law-supervision-regulations-20191223.pdf',
  '安徽省劳动保护条例_.pdf': 'anhui-labor-protection-regulations.pdf',
  '鞍山市劳动争议调解条例_.pdf': 'anshan-labor-dispute-mediation-regulations.pdf',
  '包头市劳动者工资保障条例_.pdf': 'baotou-worker-wage-protection-regulations.pdf',
  '常州市劳动教育促进条例_20230808.pdf': 'changzhou-labor-education-promotion-regulations-20230808.pdf',
  '重庆市劳动保障监察条例_20220928.pdf': 'chongqing-labor-protection-inspection-regulations-20220928.pdf',
  '大连市劳动和社会保险监察条例_.pdf': 'dalian-labor-social-inspection-regulations.pdf',
  '福建省工会劳动法律监督条例_20170725.pdf': 'fujian-labor-law-supervision-regulations-20170725.pdf',
  '福建省女职工劳动保护条例_20200320.pdf': 'fujian-female-worker-protection-regulations-20200320.pdf',
  '抚顺市职工劳动权益保障条例_20231124.pdf': 'fushun-worker-labor-rights-protection-regulations-20231124.pdf',
  '广东省工会劳动法律监督条例_20001213.pdf': 'guangdong-labor-law-supervision-regulations-20001213.pdf',
  '广东省劳动保障监察条例_20190521.pdf': 'guangdong-labor-protection-inspection-regulations-20190521.pdf',
  '广西壮族自治区劳动人事争议调解仲裁条例+_20231124.pdf': 'guangxi-labor-personnel-dispute-mediation-arbitration-regulations-20231124.pdf',
  '广州市劳动关系三方协商规定_20151223.pdf': 'guangzhou-labor-relations-tripartite-consultation-regulations-20151223.pdf',
  '贵阳市劳动保障监察条例_20210607.pdf': 'guiyang-labor-protection-inspection-regulations-20210607.pdf',
  '哈尔滨市寒冷季节室外劳动保护规定_20210825.pdf': 'harbin-cold-season-outdoor-labor-protection-regulations-20210825.pdf',
  '哈尔滨市劳动保障监察条例_20201023.pdf': 'harbin-labor-protection-inspection-regulations-20201023.pdf',
  '海南省劳动保障监察若干规定_20230416.pdf': 'hainan-labor-protection-inspection-provisions-20230416.pdf',
  '杭州市工会劳动法律监督条例_20061228.pdf': 'hangzhou-labor-law-supervision-regulations-20061228.pdf',
  '合肥市工会劳动法律监督条例_.pdf': 'hefei-labor-law-supervision-regulations.pdf',
  '合肥市劳动用工条例_20180608.pdf': 'hefei-labor-employment-regulations-20180608.pdf',
  '河北省工会劳动法律监督条例_20180727.pdf': 'hebei-labor-law-supervision-regulations-20180727.pdf',
  '河北省劳动和社会保障监察条例_.pdf': 'hebei-labor-social-inspection-regulations.pdf',
  '河南省劳动保障监察条例_20100730.pdf': 'henan-labor-protection-inspection-regulations-20100730.pdf',
  '黑龙江省劳动保障监察条例_20180628.pdf': 'heilongjiang-labor-protection-inspection-regulations-20180628.pdf',
  '黑龙江省劳动力市场管理条例_20180628.pdf': 'heilongjiang-labor-market-management-regulations-20180628.pdf',
  '黑龙江省女职工劳动保护条例_20210823.pdf': 'heilongjiang-female-worker-protection-regulations-20210823.pdf',
  '湖北省工会劳动法律监督条例_20240926.pdf': 'hubei-labor-law-supervision-regulations-20240926.pdf',
  '湖北省劳动和社会保障监察条例_20040924.pdf': 'hubei-labor-social-inspection-regulations-20040924.pdf',
  '湖南省工会劳动法律监督条例_20220926.pdf': 'hunan-labor-law-supervision-regulations-20220926.pdf',
  '湖南省劳动保障监察条例_20220526.pdf': 'hunan-labor-protection-inspection-regulations-20220526.pdf',
  '吉林省劳动保障监察条例_20241127.pdf': 'jilin-labor-protection-inspection-regulations-20241127.pdf',
  '吉林省劳动合同条例_20241127.pdf': 'jilin-labor-contract-regulations-20241127.pdf',
  '江苏省工会劳动法律监督条例_20200731.pdf': 'jiangsu-labor-law-supervision-regulations-20200731.pdf',
  '江苏省劳动合同条例_20130115.pdf': 'jiangsu-labor-contract-regulations-20130115.pdf',
  '江西省工会劳动法律监督条例_20170525.pdf': 'jiangxi-labor-law-supervision-regulations-20170525.pdf',
  '江西省劳动保障监察条例_20210728.pdf': 'jiangxi-labor-protection-inspection-regulations-20210728.pdf',
  '昆明市工会劳动法律监督条例_.pdf': 'kunming-labor-law-supervision-regulations.pdf',
  '辽宁省劳动监察条例_.pdf': 'liaoning-labor-inspection-regulations.pdf',
  '辽宁省职工劳动权益保障条例_20190927.pdf': 'liaoning-worker-labor-rights-protection-regulations-20190927.pdf',
  '南昌市工会劳动法律监督条例_.pdf': 'nanchang-labor-law-supervision-regulations.pdf',
  '内蒙古自治区工会劳动法律监督条例_20210330.pdf': 'inner-mongolia-labor-law-supervision-regulations-20210330.pdf',
  '内蒙古自治区劳动保障监察条例_20100325.pdf': 'inner-mongolia-labor-protection-inspection-regulations-20100325.pdf',
  '宁波市工会劳动保障法律监督条例_20061211.pdf': 'ningbo-labor-protection-law-supervision-regulations-20061211.pdf',
  '宁波市劳动争议处理办法_20020110.pdf': 'ningbo-labor-dispute-handling-methods-20020110.pdf',
  '宁夏回族自治区劳动保障监察条例_.pdf': 'ningxia-labor-protection-inspection-regulations.pdf',
  '宁夏回族自治区劳动合同条例+_20050325.pdf': 'ningxia-labor-contract-regulations-20050325.pdf',
  '青岛市劳动保障监察条例_20220121.pdf': 'qingdao-labor-protection-inspection-regulations-20220121.pdf',
  '青海省劳动保障监察条例_20200722.pdf': 'qinghai-labor-protection-inspection-regulations-20200722.pdf',
  '厦门经济特区劳动管理规定_20100729.pdf': 'xiamen-sez-labor-management-regulations-20100729.pdf',
  '山东省工会劳动法律监督条例_20210729.pdf': 'shandong-labor-law-supervision-regulations-20210729.pdf',
  '山东省劳动合同条例_20130801.pdf': 'shandong-labor-contract-regulations-20130801.pdf',
  '山东省劳动和社会保障监察条例_20201127.pdf': 'shandong-labor-social-inspection-regulations-20201127.pdf',
  '山东省劳动人事争议调解仲裁条例_20170728.pdf': 'shandong-labor-personnel-dispute-mediation-arbitration-regulations-20170728.pdf',
  '山西省劳动合同条例_20090224.pdf': 'shanxi-labor-contract-regulations-20090224.pdf',
  '山西省女职工劳动保护条例_20150730.pdf': 'shanxi-female-worker-protection-regulations-20150730.pdf',
  '陕西省工会劳动法律监督条例_20240927.pdf': 'shaanxi-labor-law-supervision-regulations-20240927.pdf',
  '陕西省劳动监察条例_.pdf': 'shaanxi-labor-inspection-regulations.pdf',
  '上海市劳动合同条例_20011115.pdf': 'shanghai-labor-contract-regulations-20011115.pdf',
  '深圳经济特区和谐劳动关系促进条例_20190426.pdf': 'shenzhen-sez-harmonious-labor-relations-promotion-regulations-20190426.pdf',
  '沈阳市工会劳动法律监督条例_20051027.pdf': 'shenyang-labor-law-supervision-regulations-20051027.pdf',
  '沈阳市劳动争议调解条例_20161212.pdf': 'shenyang-labor-dispute-mediation-regulations-20161212.pdf',
  '四川省劳动和社会保障监察条例_20180726.pdf': 'sichuan-labor-social-inspection-regulations-20180726.pdf',
  '天津市工会劳动法律监督条例_20201201.pdf': 'tianjin-labor-law-supervision-regulations-20201201.pdf',
  '天津市劳动和社会保障监察条例_20100925.pdf': 'tianjin-labor-social-inspection-regulations-20100925.pdf',
  '无锡市工会劳动法律监督条例_20061001.pdf': 'wuxi-labor-law-supervision-regulations-20061001.pdf',
  '新疆维吾尔自治区职工劳动权益保障条例_.pdf': 'xinjiang-worker-labor-rights-protection-regulations.pdf',
  '徐州市工会劳动法律监督条例_20220120.pdf': 'xuzhou-labor-law-supervision-regulations-20220120.pdf',
  '银川市劳动保障监察条例_20111212.pdf': 'yinchuan-labor-protection-inspection-regulations-20111212.pdf',
  '云南省工会劳动法律监督条例_20160331.pdf': 'yunnan-labor-law-supervision-regulations-20160331.pdf',
  '云南省劳动监察条例_20241128.pdf': 'yunnan-labor-inspection-regulations-20241128.pdf',
  '云南省劳动就业条例_.pdf': 'yunnan-labor-employment-regulations.pdf',
  '云南省职工劳动权益保障条例_.pdf': 'yunnan-worker-labor-rights-protection-regulations.pdf',
  '浙江省工会劳动法律监督条例_20160929.pdf': 'zhejiang-labor-law-supervision-regulations-20160929.pdf',
  '浙江省劳动保障监察条例_20200924.pdf': 'zhejiang-labor-protection-inspection-regulations-20200924.pdf',
  '浙江省劳动人事争议调解仲裁条例_20200924.pdf': 'zhejiang-labor-personnel-dispute-mediation-arbitration-regulations-20200924.pdf',
  '郑州市劳动用工条例_20120822.pdf': 'zhengzhou-labor-employment-regulations-20120822.pdf',
}

// 路径映射表
const pathMap = {
  国家法律: 'national-law',
  国家行政法规: 'national-administrative-regulations',
  地方性法规: 'local-regulations',
}

// 递归获取所有PDF文件
function getAllPdfFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      getAllPdfFiles(filePath, fileList)
    } else if (file.endsWith('.pdf')) {
      // 获取相对于law目录的路径
      const relativePath = path.relative('e:\\Workplace\\AI\\PBL2\\lawhelper\\law', filePath)
      fileList.push({
        path: filePath,
        relativePath: relativePath.replace(/\\/g, '/'), // 转换为正斜杠
        filename: file,
      })
    }
  })

  return fileList
}

// 转换文件路径为英文路径
function convertToEnglishPath(chinesePath) {
  const parts = chinesePath.split('/')
  const category = parts[0]
  const filename = parts[parts.length - 1]

  const englishCategory = pathMap[category] || 'other'
  const englishFilename = fileNameMap[filename] || filename

  return `${englishCategory}/${englishFilename}`
}

// 上传单个文件
async function uploadFile(fileInfo) {
  try {
    const fileBuffer = fs.readFileSync(fileInfo.path)
    const englishPath = convertToEnglishPath(fileInfo.relativePath)

    const { data, error } = await supabase.storage
      .from('law-documents')
      .upload(englishPath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error(`❌ 上传失败 ${fileInfo.relativePath} -> ${englishPath}:`, error.message)
      return false
    }

    console.log(`✅ 上传成功 ${fileInfo.relativePath} -> ${englishPath}`)
    return { originalPath: fileInfo.relativePath, englishPath, uploadData: data }
  } catch (error) {
    console.error(`❌ 读取文件失败 ${fileInfo.relativePath}:`, error.message)
    return false
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始批量上传法律文书到Supabase Storage...')

    // 获取所有PDF文件
    const lawDir = 'e:\\Workplace\\AI\\PBL2\\lawhelper\\law'
    const pdfFiles = getAllPdfFiles(lawDir)

    console.log(`📄 找到 ${pdfFiles.length} 个PDF文件`)

    let successCount = 0
    let failCount = 0
    const uploadResults = []

    // 批量上传文件
    for (const file of pdfFiles) {
      const result = await uploadFile(file)
      if (result) {
        successCount++
        uploadResults.push(result)
      } else {
        failCount++
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('\\n🎉 上传完成!')
    console.log(`✅ 成功: ${successCount} 个文件`)
    console.log(`❌ 失败: ${failCount} 个文件`)

    if (successCount > 0) {
      console.log('\\n📋 文件路径映射:')
      uploadResults.forEach((result) => {
        console.log(`  ${result.originalPath} -> ${result.englishPath}`)
      })

      console.log('\\n🔗 公共访问URL示例:')
      const firstResult = uploadResults[0]
      const { data: { publicUrl } } = supabase.storage
        .from('law-documents')
        .getPublicUrl(firstResult.englishPath)
      console.log(`  ${publicUrl}`)
    }
  } catch (error) {
    console.error('❌ 上传过程发生错误:', error)
  }
}

// 运行脚本
main()
