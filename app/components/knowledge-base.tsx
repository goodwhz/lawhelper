'use client'

import React, { useState } from 'react'

interface LawDocument {
  id: string
  title: string
  category: string
  description: string
  filePath: string
}

const KnowledgeBase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 模拟法律文档数据
  const lawDocuments: LawDocument[] = [
    {
      id: '1',
      title: '中华人民共和国劳动合同法',
      category: '劳动合同',
      description: '规范劳动合同的订立、履行、变更、解除和终止的法律',
      filePath: '/law/劳动合同法.docx'
    },
    {
      id: '2',
      title: '中华人民共和国劳动法',
      category: '基本法律',
      description: '保护劳动者合法权益，调整劳动关系的基本法律',
      filePath: '/law/劳动法.docx'
    },
    {
      id: '3',
      title: '中华人民共和国社会保险法',
      category: '社会保险',
      description: '规范社会保险制度，保障公民社会保险权益的法律',
      filePath: '/law/社会保险法.docx'
    },
    {
      id: '4',
      title: '工伤保险条例',
      category: '工伤保险',
      description: '规范工伤保险待遇和管理的行政法规',
      filePath: '/law/工伤保险条例.docx'
    },
    {
      id: '5',
      title: '女职工劳动保护特别规定',
      category: '劳动保护',
      description: '保护女职工在劳动过程中的安全与健康',
      filePath: '/law/女职工劳动保护特别规定.docx'
    },
    {
      id: '6',
      title: '劳动争议调解仲裁法',
      category: '争议解决',
      description: '规范劳动争议调解和仲裁程序的法律',
      filePath: '/law/劳动争议调解仲裁法.docx'
    }
  ]

  const categories = ['all', '劳动合同', '基本法律', '社会保险', '工伤保险', '劳动保护', '争议解决']

  const filteredDocuments = lawDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDownload = (doc: LawDocument) => {
    // 模拟下载功能
    alert(`开始下载: ${doc.title}`)
    // 实际实现中这里应该调用文件下载API
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">劳动法知识库</h1>
          <p className="text-lg text-gray-600">收录最新、最全的劳动相关法律法规原文</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索法律法规..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
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

        {/* 文档列表 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {doc.category}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{doc.title}</h3>
                <p className="text-gray-600 mb-4">{doc.description}</p>
                <button
                  onClick={() => handleDownload(doc)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看文档
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">未找到相关法律法规</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeBase