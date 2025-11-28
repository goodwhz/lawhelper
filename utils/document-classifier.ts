// 自动分类法律文档的工具函数

interface LawDocument {
  id: string
  title: string
  category: string
  description: string
  filePath: string
}

// 直接按照文件夹名称分类
export function classifyDocument(filePath: string): string {
  // 根据文件路径判断分类
  if (filePath.includes('国家法律/')) {
    return '国家法律'
  } else if (filePath.includes('国家新政法规/')) {
    return '国家行政法规'
  } else if (filePath.includes('地方性法规/')) {
    return '地方性法规'
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
    // 首先提取文件名（移除文件夹路径）
    const fileNameOnly = filename.split('/').pop() || filename

    // 提取标题（移除下划线和日期）
    const title = fileNameOnly
      .replace(/_[\d]{8}/g, '') // 移除日期
      .replace(/[+]/g, '') // 移除加号
      .replace(/\.(docx?)$/i, '') // 移除文件扩展名
      .trim()

    const category = classifyDocument(filename)
    const description = generateDescription(title, category)

    return {
      id: (index + 1).toString(),
      title,
      category,
      description,
      filePath: `/${filename}`,
    }
  })
}

// 获取所有分类
export function getAllCategories(documents: LawDocument[]): string[] {
  const categories = new Set(documents.map(doc => doc.category))
  return ['all', ...Array.from(categories)]
}
