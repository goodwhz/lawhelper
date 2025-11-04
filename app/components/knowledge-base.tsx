'use client'

import React, { useState, useEffect } from 'react'
import DocumentPreview from './document-preview'
import { processAllDocuments, getAllCategories } from '../../utils/document-classifier'

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<LawDocument | null>(null)
  const [lawDocuments, setLawDocuments] = useState<LawDocument[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])

  // 从三个文件夹中获取所有法律文档文件
  const allFilenames = [
    // 国家法律文件夹中的文件
    '国家法律/中华人民共和国劳动法_20181229.docx',
    '国家法律/中华人民共和国劳动合同法_20121228.docx',
    '国家法律/中华人民共和国劳动合同法实施条例_20080918.docx',
    '国家法律/中华人民共和国劳动争议调解仲裁法_20071229.docx',
    '国家法律/中华人民共和国民法典_20200528.docx',

    // 国家新政法规文件夹中的文件
    '国家新政法规/使用有毒物品作业场所劳动保护条例_20241206.docx',
    '国家新政法规/劳动保障监察条例_20041101.docx',
    '国家新政法规/劳动就业服务企业管理规定_19901122.docx',
    '国家新政法规/工人考核条例_19900711.docx',
    '国家新政法规/工伤保险条例_20101220.docx',

    // 地方性法规文件夹中的文件（前15个作为示例）
    '地方性法规/上海市劳动合同条例_20011115.docx',
    '地方性法规/云南省劳动就业条例_.docx',
    '地方性法规/云南省劳动监察条例_20241128.docx',
    '地方性法规/云南省工会劳动法律监督条例_20160331.docx',
    '地方性法规/云南省职工劳动权益保障条例_.docx',
    '地方性法规/内蒙古自治区劳动保障监察条例_20100325.doc',
    '地方性法规/内蒙古自治区工会劳动法律监督条例_20210330.doc',
    '地方性法规/包头市劳动者工资保障条例_.doc',
    '地方性法规/南昌市工会劳动法律监督条例_.docx',
    '地方性法规/厦门经济特区劳动管理规定_20100729.doc',
    '地方性法规/合肥市劳动用工条例_20180608.docx',
    '地方性法规/合肥市工会劳动法律监督条例_.docx',
    '地方性法规/吉林省劳动保障监察条例_20241127.docx',
    '地方性法规/吉林省劳动合同条例_20241127.docx',
    '地方性法规/哈尔滨市劳动保障监察条例_20201023.doc',
  ]

  useEffect(() => {
    // 处理所有文档
    const documents = processAllDocuments(allFilenames)
    setLawDocuments(documents)
    setCategories(getAllCategories(documents))
  }, [])

  const filteredDocuments = lawDocuments.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      || doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleViewDocument = (doc: LawDocument) => {
    setSelectedDocument(doc)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedDocument(null)
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-law-red-800 mb-4">劳动法知识库</h1>
          <p className="text-lg text-law-blue-700">收录最新、最全的劳动相关法律法规原文</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索法律法规..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-law-red-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    selectedCategory === category
                      ? 'bg-law-red-600 text-white'
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
            <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-law-blue-100 text-law-blue-800 text-sm rounded-full">
                    {doc.category}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{doc.title}</h3>
                <p className="text-gray-600 mb-4 flex-1">{doc.description}</p>
                <button
                  onClick={() => handleViewDocument(doc)}
                  className="w-full bg-law-red-600 text-white py-2 px-4 rounded-lg hover:bg-law-red-700 transition-colors"
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

      {/* 文档预览弹窗 */}
      {selectedDocument && (
        <DocumentPreview
          isOpen={previewOpen}
          onClose={handleClosePreview}
          document={selectedDocument}
        />
      )}
    </div>
  )
}

export default KnowledgeBase
