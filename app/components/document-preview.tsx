'use client'

import React, { useState } from 'react'

interface LawDocumentWithCategory {
  id: string
  title: string
  content: string
  category_id: string
  category_name: string
  created_at: string
}

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  document: LawDocumentWithCategory
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ isOpen, onClose, document: doc }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview')

  const handleDownload = () => {
    if (typeof window !== 'undefined') {
      // 创建文档内容为文本文件下载
      const content = `# ${doc.title}\n\n分类: ${doc.category_name}\n\n${doc.content}`

      // 创建Blob对象
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })

      // 创建下载链接
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${doc.title}.txt`

      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放URL对象
      URL.revokeObjectURL(link.href)
    }
  }

  const handleFullView = () => {
    setViewMode('full')
  }

  const handlePreview = () => {
    setViewMode('preview')
  }

  if (!isOpen) { return null }

  // 全屏视图
  if (viewMode === 'full') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
                <p className="text-gray-600 mt-1">分类: {doc.category_name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  下载
                </button>
                <button
                  onClick={handlePreview}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  返回预览
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              {doc.content}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  // 预览模式视图
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">文档预览</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{doc.title}</h4>
            <p className="text-gray-600 mb-4">分类: {doc.category_name}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
              {doc.content.length > 1000 ? `${doc.content.substring(0, 1000)}...` : doc.content}
            </pre>
            {doc.content.length > 1000 && (
              <p className="text-gray-500 text-sm mt-2">
                （文档内容较长，只显示前1000个字符）
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleFullView}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              查看完整文档
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              下载文档
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview
