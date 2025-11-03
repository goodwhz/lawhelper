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

  // 使用所有93个法律文档文件
  const allFilenames = [
    '安徽省工会劳动法律监督条例_20191223.doc',
    '安徽省劳动保护条例_.docx',
    '鞍山市劳动争议调解条例_.docx',
    '包头市劳动者工资保障条例_.doc',
    '常州市劳动教育促进条例_20230808.docx',
    '重庆市劳动保障监察条例_20220928.doc',
    '大连市劳动和社会保险监察条例_.docx',
    '福建省工会劳动法律监督条例_20170725.docx',
    '福建省女职工劳动保护条例_20200320.docx',
    '抚顺市职工劳动权益保障条例_20231124.docx',
    '工人考核条例_19900711.docx',
    '工伤保险条例_20101220 (1).docx',
    '工伤保险条例_20101220.docx',
    '广东省工会劳动法律监督条例_20001213.docx',
    '广东省劳动保障监察条例_20190521.docx',
    '广西壮族自治区劳动人事争议调解仲裁条例+_20231124.docx',
    '广州市劳动关系三方协商规定_20151223.docx',
    '贵阳市劳动保障监察条例_20210607.docx',
    '贵州省劳动保障监察条例_20130118.docx',
    '哈尔滨市寒冷季节室外劳动保护规定_20210825.doc',
    '哈尔滨市劳动保障监察条例_20201023.doc',
    '海南省劳动保障监察若干规定_20230416.docx',
    '杭州市工会劳动法律监督条例_20061228.docx',
    '合肥市工会劳动法律监督条例_.docx',
    '合肥市劳动用工条例_20180608.docx',
    '河北省工会劳动法律监督条例_20180727.docx',
    '河北省劳动和社会保障监察条例_.docx',
    '河南省劳动保障监察条例_20100730 (1).docx',
    '河南省劳动保障监察条例_20100730.docx',
    '黑龙江省劳动保障监察条例_20180628.doc',
    '黑龙江省劳动力市场管理条例_20180628.doc',
    '黑龙江省女职工劳动保护条例_20210823.docx',
    '湖北省工会劳动法律监督条例_20240926.docx',
    '湖北省劳动和社会保障监察条例_20040924.docx',
    '湖南省工会劳动法律监督条例_20220926.docx',
    '湖南省劳动保障监察条例_20220526.docx',
    '吉林省劳动保障监察条例_20241127.docx',
    '吉林省劳动合同条例_20241127.docx',
    '江苏省工会劳动法律监督条例_20200731.doc',
    '江苏省劳动合同条例_20130115.docx',
    '江西省工会劳动法律监督条例_20170525.docx',
    '江西省劳动保障监察条例_20210728.docx',
    '昆明市工会劳动法律监督条例_.docx',
    '劳动保障监察条例_20041101.docx',
    '劳动就业服务企业管理规定_19901122.docx',
    '辽宁省劳动监察条例_.docx',
    '辽宁省职工劳动权益保障条例_20190927.doc',
    '南昌市工会劳动法律监督条例_.docx',
    '内蒙古自治区工会劳动法律监督条例_20210330.doc',
    '内蒙古自治区劳动保障监察条例_20100325.doc',
    '宁波市工会劳动保障法律监督条例_20061211.docx',
    '宁波市劳动争议处理办法_20020110 (1).docx',
    '宁波市劳动争议处理办法_20020110.docx',
    '宁夏回族自治区劳动保障监察条例_.doc',
    '宁夏回族自治区劳动合同条例+_20050325.doc',
    '女职工劳动保护特别规定_20120428.docx',
    '青岛市劳动保障监察条例_20220121.docx',
    '青海省劳动保障监察条例_20200722 (1).docx',
    '青海省劳动保障监察条例_20200722.docx',
    '厦门经济特区劳动管理规定_20100729.doc',
    '山东省工会劳动法律监督条例_20210729.docx',
    '山东省劳动合同条例_20130801.docx',
    '山东省劳动和社会保障监察条例_20201127.docx',
    '山东省劳动人事争议调解仲裁条例_20170728.docx',
    '山西省劳动合同条例_20090224.doc',
    '山西省女职工劳动保护条例_20150730.docx',
    '陕西省工会劳动法律监督条例_20240927.docx',
    '陕西省劳动监察条例_.docx',
    '上海市劳动合同条例_20011115.docx',
    '深圳经济特区和谐劳动关系促进条例_20190426.docx',
    '沈阳市工会劳动法律监督条例_20051027.docx',
    '沈阳市劳动争议调解条例_20161212.docx',
    '使用有毒物品作业场所劳动保护条例_20241206.docx',
    '四川省劳动和社会保障监察条例_20180726.doc',
    '天津市工会劳动法律监督条例_20201201.docx',
    '天津市劳动和社会保障监察条例_20100925.doc',
    '无锡市工会劳动法律监督条例_20061001.docx',
    '新疆维吾尔自治区职工劳动权益保障条例_.docx',
    '徐州市工会劳动法律监督条例_20220120.doc',
    '银川市劳动保障监察条例_20111212.doc',
    '云南省工会劳动法律监督条例_20160331.docx',
    '云南省劳动监察条例_20241128.docx',
    '云南省劳动就业条例_.docx',
    '云南省职工劳动权益保障条例_.docx',
    '浙江省工会劳动法律监督条例_20160929.docx',
    '浙江省劳动保障监察条例_20200924.docx',
    '浙江省劳动人事争议调解仲裁条例_20200924.docx',
    '郑州市劳动用工条例_20120822.docx',
    '中华人民共和国劳动法_20181229.docx',
    '中华人民共和国劳动合同法_20121228.docx',
    '中华人民共和国劳动合同法实施条例_20080918.docx',
    '中华人民共和国劳动争议调解仲裁法_20071229.docx',
    '中华人民共和国民法典_20200528.docx'
  ]

  useEffect(() => {
    // 处理所有文档
    const documents = processAllDocuments(allFilenames)
    setLawDocuments(documents)
    setCategories(getAllCategories(documents))
  }, [])

  const filteredDocuments = lawDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="min-h-screen bg-gradient-to-br from-law-red-50 via-law-orange-50 to-law-blue-50 py-8">
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
                onChange={(e) => setSearchTerm(e.target.value)}
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