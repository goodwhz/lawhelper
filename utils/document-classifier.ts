// 自动分类法律文档的工具函数

interface LawDocument {
  id: string
  title: string
  category: string
  description: string
  filePath: string
}

// 分类规则
const categoryRules = {
  '行政法规': ['条例', '规定', '办法'],
  '地方性法规': ['省', '市', '自治区', '州', '县', '区'],
  '国家法律': ['中华人民共和国', '劳动法', '劳动合同法', '民法典'],
  '部门规章': ['规定', '办法', '细则'],
  '司法解释': ['解释', '规定', '批复']
}

// 自动分类函数
export function classifyDocument(filename: string): string {
  const title = filename.replace(/[_.\d]/g, ' ').trim()
  
  // 检查国家法律
  if (title.includes('中华人民共和国') || title.includes('劳动法') || 
      title.includes('劳动合同法') || title.includes('民法典')) {
    return '国家法律'
  }
  
  // 检查地方性法规
  if (title.includes('省') || title.includes('市') || title.includes('自治区') ||
      title.includes('州') || title.includes('县') || title.includes('区')) {
    return '地方性法规'
  }
  
  // 检查行政法规
  if (title.includes('条例') && !title.includes('省') && !title.includes('市')) {
    return '行政法规'
  }
  
  // 默认分类
  return '行政法规'
}

// 生成描述
export function generateDescription(title: string, category: string): string {
  return `${title}相关${category}`
}

// 处理所有文件
export function processAllDocuments(filenames: string[]): LawDocument[] {
  return filenames.map((filename, index) => {
    // 提取标题（移除下划线和日期）
    const title = filename
      .replace(/_[\d]{8}/g, '') // 移除日期
      .replace(/[+]/g, '') // 移除加号
      .replace(/\.(docx?)$/i, '') // 移除文件扩展名
      .trim()
    
    const category = classifyDocument(filename)
    const description = generateDescription(title, category)
    
    return {
      id: (index + 1).toString(),
      title: title,
      category: category,
      description: description,
      filePath: `/${filename}`
    }
  })
}

// 获取所有分类
export function getAllCategories(documents: LawDocument[]): string[] {
  const categories = new Set(documents.map(doc => doc.category))
  return ['all', ...Array.from(categories)]
}