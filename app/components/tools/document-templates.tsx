'use client'

import React, { useState } from 'react'

interface DocumentTemplate {
  id: string
  title: string
  description: string
  category: string
  downloadUrl: string
}

const DocumentTemplates: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const templates: DocumentTemplate[] = [
    {
      id: '1',
      title: '辞职信模板',
      description: '标准辞职信格式，包含离职原因、离职日期等必要信息',
      category: '离职文书',
      downloadUrl: '/api/template/辞职信模板.doc',
    },
    {
      id: '2',
      title: '被迫解除劳动合同通知书',
      description: '用于用人单位违法时，劳动者单方解除劳动合同的正式通知',
      category: '解除合同',
      downloadUrl: '/api/template/被迫解除劳动合同通知书.doc',
    },
    {
      id: '3',
      title: '劳动仲裁申请书',
      description: '劳动争议仲裁申请的标准格式文书',
      category: '仲裁诉讼',
      downloadUrl: '/api/template/劳动仲裁申请书.doc',
    },
    {
      id: '4',
      title: '工伤认定申请表',
      description: '申请工伤认定的标准表格',
      category: '工伤保险',
      downloadUrl: '/api/template/工伤认定申请表.doc',
    },
    {
      id: '5',
      title: '加班申请单',
      description: '标准加班申请表格',
      category: '日常工作',
      downloadUrl: '/api/template/加班申请单.doc',
    },
    {
      id: '6',
      title: '请假申请单',
      description: '各类请假申请的通用表格',
      category: '日常工作',
      downloadUrl: '/api/template/请假申请单.doc',
    },
    {
      id: '7',
      title: '工资异议申诉书',
      description: '对工资计算有异议时的申诉文书',
      category: '工资争议',
      downloadUrl: '/api/template/工资异议申诉书.doc',
    },
    {
      id: '8',
      title: '劳动合同续签申请书',
      description: '劳动合同到期续签申请的标准格式',
      category: '合同管理',
      downloadUrl: '/api/template/劳动合同续签申请书.doc',
    },
  ]

  const categories = ['all', '离职文书', '解除合同', '仲裁诉讼', '工伤保险', '日常工作', '工资争议', '合同管理']

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
      || template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDownload = async (template: DocumentTemplate) => {
    try {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = template.downloadUrl
      link.download = `${template.title}.doc`
      link.target = '_blank'

      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 下载成功，浏览器会自动处理，不需要额外提示
      console.log(`开始下载: ${template.title}`)
    } catch (error) {
      console.error('下载失败:', error)
      // 可以在这里添加更优雅的错误处理，比如使用Toast通知
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      离职文书: 'bg-red-100 text-red-800',
      解除合同: 'bg-orange-100 text-orange-800',
      仲裁诉讼: 'bg-purple-100 text-purple-800',
      工伤保险: 'bg-blue-100 text-blue-800',
      日常工作: 'bg-green-100 text-green-800',
      工资争议: 'bg-yellow-100 text-yellow-800',
      合同管理: 'bg-indigo-100 text-indigo-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">文书模板库</h3>

      {/* 搜索和筛选 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索文书模板..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map(template => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            </div>
            <h4 className="font-semibold text-lg mb-2">{template.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            <button
              onClick={() => handleDownload(template)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              下载模板
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">未找到相关文书模板</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-blue-800 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 点击"下载模板"获取标准格式的文书模板</li>
          <li>• 下载后可根据实际情况修改具体内容</li>
          <li>• 建议在使用前咨询专业法律人士</li>
          <li>• 模板仅供参考，具体内容需根据实际情况调整</li>
        </ul>
      </div>
    </div>
  )
}

export default DocumentTemplates
