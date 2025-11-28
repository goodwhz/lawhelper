'use client'

import React, { useState } from 'react'

const demoDocuments = [
  {
    id: 1,
    title: '劳动保障监察条例',
    fileName: '地方性法规/劳动保障监察条例_20041101.docx',
    description: '包含基本段落和标题格式的文档',
  },
  {
    id: 2,
    title: '安徽省劳动保护条例',
    fileName: '地方性法规/安徽省劳动保护条例_.docx',
    description: '包含表格和列表格式的文档',
  },
  {
    id: 3,
    title: '江苏省劳动合同条例',
    fileName: '地方性法规/江苏省劳动合同条例_20130115.docx',
    description: '包含复杂格式和章节结构的文档',
  },
]

export default function MammothDemoPage() {
  const [selectedDoc, setSelectedDoc] = useState(demoDocuments[0])
  const [isPreviewing, setIsPreviewing] = useState(false)

  const handlePreview = (document: typeof demoDocuments[0]) => {
    setSelectedDoc(document)
    const previewUrl = `/preview?file=${encodeURIComponent(document.fileName)}&title=${encodeURIComponent(document.title)}`
    window.open(previewUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mammoth.js 文档预览演示</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            使用 Mammoth.js 库将 Word 文档(.docx)转换为 HTML 格式进行预览。
            支持表格、列表、段落等基本格式，纯前端实现，无需服务器支持。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 文档列表 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">选择测试文档</h2>
            <div className="space-y-4">
              {demoDocuments.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDoc.id === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <h3 className="font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(doc)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      预览文档
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const downloadUrl = `/api/law/${encodeURIComponent(doc.fileName)}`
                        const link = document.createElement('a')
                        link.href = downloadUrl
                        link.download = `${doc.title}.docx`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      下载原文档
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 功能说明 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mammoth.js 功能特点</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">📄 浏览器端转换</h3>
                <p className="text-blue-700 text-sm">
                  直接在浏览器中将 Word 文档转换为 HTML，无需服务器处理
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">📊 格式支持</h3>
                <p className="text-green-700 text-sm">
                  支持表格、列表、段落、标题、粗体、斜体等基本格式
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-800 mb-2">⚡ 快速预览</h3>
                <p className="text-purple-700 text-sm">
                  文档转换速度快，用户体验流畅，支持实时预览
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-800 mb-2">🔧 技术特性</h3>
                <p className="text-orange-700 text-sm">
                  • 纯前端实现，无需服务器支持<br/>
                  • 支持 .docx 格式文档<br/>
                  • 自动处理中文编码<br/>
                  • 响应式设计，支持移动端
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">💡 使用说明</h3>
              <p className="text-yellow-700 text-sm">
                1. 从左侧选择要预览的文档<br/>
                2. 点击"预览文档"在新窗口查看转换效果<br/>
                3. 如需原始文件，可点击"下载原文档"<br/>
                4. 转换效果不理想时建议下载原文档查看
              </p>
            </div>
          </div>
        </div>

        {/* 技术栈说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">技术栈</h2>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">⚛️</div>
              <h3 className="font-medium">Next.js 15</h3>
              <p className="text-sm text-gray-600">React 全栈框架</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🦣</div>
              <h3 className="font-medium">Mammoth.js</h3>
              <p className="text-sm text-gray-600">文档转换库</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-medium">Tailwind CSS</h3>
              <p className="text-sm text-gray-600">样式框架</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-medium">TypeScript</h3>
              <p className="text-sm text-gray-600">类型安全</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
