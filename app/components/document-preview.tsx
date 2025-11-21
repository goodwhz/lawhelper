'use client'

import React, { useState } from 'react'

interface LawDocumentWithCategory {
  id: string
  title: string
  content: string
  category_id: string
  document_type: string
  document_number: string | null
  publish_date: string | null
  effective_date: string | null
  expire_date: string | null
  file_path: string | null
  file_size: number | null
  file_type: string | null
  download_count: number
  view_count: number
  is_published: boolean
  is_featured: boolean
  keywords: string[] | null
  tags: string[] | null
  created_at: string
  updated_at: string
  category_name: string
}

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  document: LawDocumentWithCategory
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ isOpen, onClose, document: doc }) => {
  const [_isLoading, _setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'full' | 'pdf' | 'text'>('preview')

  const handleDownload = (fileType: 'pdf' | 'txt') => {
    if (typeof window !== 'undefined') {
      if (fileType === 'pdf' && doc.file_path && doc.file_path.endsWith('.pdf')) {
        // 下载PDF文件
        const link = document.createElement('a')
        link.href = `/api/law/${encodeURIComponent(doc.file_path)}`
        link.download = `${doc.title}.pdf`
        link.target = '_blank' // 在新窗口中打开，防止阻塞

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (fileType === 'txt') {
        // 下载文本内容
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
                {doc.file_path && doc.file_path.endsWith('.pdf') && (
                  <button
                    onClick={() => setViewMode('pdf')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    PDF预览
                  </button>
                )}
                <button
                  onClick={() => handleDownload('pdf')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  下载PDF
                </button>
                <button
                  onClick={() => handleDownload('txt')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  下载TXT
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
          {/* 视图模式切换 */}
          {doc.file_path && doc.file_path.endsWith('.pdf') && (
            <div className="mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'pdf'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  PDF预览
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  文本预览
                </button>
              </div>
            </div>
          )}

          {viewMode === 'pdf' && doc.file_path && doc.file_path.endsWith('.pdf')
            ? (
              // PDF文件全屏查看
              <div className="w-full flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">此文档为PDF格式文件</p>
                    <p className="text-xs text-gray-500">使用内置预览或下载查看</p>
                  </div>
                  <a
                    href={`/api/law/${encodeURIComponent(doc.file_path)}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    在新窗口中打开
                  </a>
                </div>

                <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 mb-6">
                  <iframe
                    src={`/api/law/${encodeURIComponent(doc.file_path)}?preview=true`}
                    className="w-full h-96 min-h-96"
                    title={doc.title}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>

                {doc.content && (
                  <div className="bg-gray-50 rounded-lg p-6 mt-4 w-full">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">文档内容摘要</h3>
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                      {doc.content.length > 2000 ? `${doc.content.substring(0, 2000)}...` : doc.content}
                    </pre>
                    {doc.content.length > 2000 && (
                      <p className="text-gray-500 text-sm mt-2">
                        （文档内容较长，只显示前2000个字符）
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
            : (
              // 文本内容全屏查看
              <div className="prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {doc.content}
                </pre>
              </div>
            )}
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

          {/* 视图模式切换 */}
          {doc.file_path && doc.file_path.endsWith('.pdf') && (
            <div className="mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'pdf'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  PDF预览
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  文本预览
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            {viewMode === 'pdf' && doc.file_path && doc.file_path.endsWith('.pdf')
              ? (
                // PDF文件预览
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">此文档为PDF格式文件</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">使用内置预览或下载查看</p>
                      <a
                        href={`/api/law/${encodeURIComponent(doc.file_path)}?preview=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        在新窗口中打开
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={`/api/law/${encodeURIComponent(doc.file_path)}?preview=true`}
                      className="w-full h-full min-h-80"
                      title={doc.title}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>
                </div>
              )
              : (
                // 文本内容预览
                <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                  {doc.content.length > 1000 ? `${doc.content.substring(0, 1000)}...` : doc.content}
                </pre>
              )}

            {viewMode !== 'pdf' && doc.content.length > 1000 && (
              <p className="text-gray-500 text-sm mt-2">
                （文档内容较长，只显示前1000个字符）
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-3">
            {/* 查看完整文档按钮 */}
            <button
              onClick={handleFullView}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              查看完整文档
            </button>

            {/* 下载选项 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {doc.file_path && doc.file_path.endsWith('.pdf') && (
                <button
                  onClick={() => handleDownload('pdf')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  下载PDF
                </button>
              )}

              <button
                onClick={() => handleDownload('txt')}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                下载TXT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview
