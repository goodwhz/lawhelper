const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

// 主函数
async function createPreciseMapping() {
  try {
    console.log('🔍 分析数据库中的文件路径...')

    // 获取所有法律文档
    const { data: documents, error: getError } = await supabase
      .from('law_documents')
      .select('id, title, file_path')

    if (getError) {
      console.error('获取文档失败:', getError)
      return
    }

    console.log(`📄 找到 ${documents.length} 条法律文档记录`)

    // 分析现有的文件路径
    const pathAnalysis = {}
    const missingFiles = []

    for (const doc of documents) {
      if (doc.file_path) {
        // 从路径中提取文件名
        const pathParts = doc.file_path.split('/')
        let fileName = ''

        if (pathParts.length > 1) {
          fileName = pathParts[pathParts.length - 1]
        } else {
          fileName = path.basename(doc.file_path)
        }

        // 存储分析结果
        pathAnalysis[doc.id] = {
          title: doc.title,
          originalPath: doc.file_path,
          fileName,
          needsMapping: true,
        }

        // 检查是否在映射表中
        const existingMapping = JSON.parse(fs.readFileSync(
          path.join(__dirname, 'file-mapping.json'),
          'utf8',
        ))

        if (!existingMapping[fileName]) {
          missingFiles.push({
            id: doc.id,
            title: doc.title,
            fileName,
            originalPath: doc.file_path,
          })
        }
      }
    }

    // 保存分析结果
    fs.writeFileSync(
      path.join(__dirname, 'path-analysis.json'),
      JSON.stringify(pathAnalysis, null, 2),
    )

    console.log('\n📋 路径分析结果:')
    console.log('需要映射的文件:')
    missingFiles.forEach((file) => {
      console.log(`- ${file.title}: ${file.fileName}`)
    })

    console.log(`\n总共有 ${missingFiles.length} 个文件需要映射`)

    // 生成新的映射关系
    const newMapping = {}

    for (const file of missingFiles) {
      // 根据文件名和目录生成新的映射
      let newPath = ''

      // 检查目录前缀
      if (file.originalPath.includes('local-regulations/')) {
        newPath = `local-regulations/${generateEnglishName(file.fileName)}`
      } else if (file.originalPath.includes('national-administrative-regulations/')) {
        newPath = `national-administrative-regulations/${generateEnglishName(file.fileName)}`
      } else if (file.originalPath.includes('national-law/')) {
        newPath = `national-law/${generateEnglishName(file.fileName)}`
      }

      newMapping[file.fileName] = newPath
    }

    // 保存新的映射表
    fs.writeFileSync(
      path.join(__dirname, 'new-mapping.json'),
      JSON.stringify(newMapping, null, 2),
    )

    console.log('\n📋 新的映射表已生成')
    console.log('文件: new-mapping.json')

    // 更新数据库
    console.log('\n🚀 开始更新数据库...')

    let updateCount = 0
    let errorCount = 0

    for (const file of missingFiles) {
      const newPath = newMapping[file.fileName]

      if (newPath) {
        const { error: updateError } = await supabase
          .from('law_documents')
          .update({ file_path: newPath })
          .eq('id', file.id)

        if (updateError) {
          console.error(`❌ 更新失败 "${file.title}":`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ 更新成功 "${file.title}"`)
          updateCount++
        }

        // 添加延迟
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('\n🎉 更新完成!')
    console.log(`✅ 成功更新: ${updateCount} 条记录`)
    console.log(`❌ 失败: ${errorCount} 条记录`)
  } catch (error) {
    console.error('❌ 分析过程发生错误:', error)
  }
}

// 生成英文文件名
function generateEnglishName(chineseName) {
  // 移除扩展名
  const nameWithoutExt = path.basename(chineseName, path.extname(chineseName))

  // 根据内容生成英文名称
  if (nameWithoutExt.includes('劳动法')) {
    return 'labor-law.pdf'
  } else if (nameWithoutExt.includes('劳动合同法')) {
    return 'labor-contract-law.pdf'
  } else if (nameWithoutExt.includes('劳动争议调解仲裁法')) {
    return 'labor-dispute-arbitration-law.pdf'
  } else if (nameWithoutExt.includes('民法典')) {
    return 'civil-code.pdf'
  } else if (nameWithoutExt.includes('劳动合同法实施条例')) {
    return 'labor-contract-law-regulation.pdf'
  } else if (nameWithoutExt.includes('工伤保险条例')) {
    return 'work-injury-insurance-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动保障监察条例')) {
    return 'labor-protection-inspection-regulation.pdf'
  } else if (nameWithoutExt.includes('女职工劳动保护')) {
    return 'female-worker-protection-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动就业服务企业管理规定')) {
    return 'labor-employment-service-enterprise-management-regulation.pdf'
  } else if (nameWithoutExt.includes('工人考核条例')) {
    return 'worker-assessment-regulation.pdf'
  } else if (nameWithoutExt.includes('使用有毒物品作业场所劳动保护条例')) {
    return 'toxic-workplace-protection-regulation.pdf'
  } else if (nameWithoutExt.includes('工会劳动法律监督条例')) {
    return 'labor-law-supervision-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动保护条例')) {
    return 'labor-protection-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动争议调解')) {
    return 'labor-dispute-mediation-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动争议处理办法')) {
    return 'labor-dispute-handling-methods.pdf'
  } else if (nameWithoutExt.includes('劳动合同条例')) {
    return 'labor-contract-regulation.pdf'
  } else if (nameWithoutExt.includes('劳动关系三方协商规定')) {
    return 'labor-relations-tripartite-consultation-regulations.pdf'
  } else if (nameWithoutExt.includes('劳动人事争议调解仲裁条例')) {
    return 'labor-personnel-dispute-mediation-arbitration-regulations.pdf'
  } else if (nameWithoutExt.includes('劳动教育促进条例')) {
    return 'labor-education-promotion-regulations.pdf'
  } else if (nameWithoutExt.includes('和谐劳动关系促进条例')) {
    return 'harmonious-labor-relations-promotion-regulations.pdf'
  } else if (nameWithoutExt.includes('寒冷季节室外劳动保护规定')) {
    return 'cold-season-outdoor-labor-protection-regulations.pdf'
  } else if (nameWithoutExt.includes('劳动管理规定')) {
    return 'labor-management-regulations.pdf'
  } else if (nameWithoutExt.includes('劳动者工资保障条例')) {
    return 'laborer-wage-security-regulations.pdf'
  } else if (nameWithoutExt.includes('劳动用工条例')) {
    return 'labor-employment-regulations.pdf'
  } else {
    // 使用哈希值作为后备
    const crypto = require('crypto')
    const hash = crypto.createHash('md5').update(nameWithoutExt).digest('hex').substring(0, 8)
    return `regulation-${hash}.pdf`
  }
}

// 运行脚本
createPreciseMapping()
