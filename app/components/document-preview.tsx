'use client'

import React, { useState } from 'react'

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    title: string
    category: string
    description: string
    filePath: string
  }
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ isOpen, onClose, document: doc }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleDownload = () => {
    // 实际下载功能
    if (typeof window !== 'undefined') {
      // 从文件路径中提取文件名
      const fileName = doc.filePath.startsWith('/') ? doc.filePath.substring(1) : doc.filePath
      
      // 使用API端点下载文件
      const downloadUrl = `/api/law/${encodeURIComponent(fileName)}`
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = doc.title + (doc.filePath.endsWith('.docx') ? '.docx' : '.doc')
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePreview = async () => {
    setIsLoading(true)
    try {
      // 从文件路径中提取文件名
      const fileName = doc.filePath.startsWith('/') ? doc.filePath.substring(1) : doc.filePath
      
      // 构建完整的文件URL
      const fileUrl = `${window.location.origin}/api/law/${encodeURIComponent(fileName)}`
      
      // 使用Microsoft Office Online预览服务
      const previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
      
      setPreviewUrl(previewUrl)
    } catch (error) {
      console.error('预览错误:', error)
      alert('预览功能暂时不可用，请下载后查看。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewUrl(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${previewUrl ? 'max-w-6xl w-full h-5/6' : 'max-w-md w-full mx-4'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {previewUrl ? '文档预览' : '文档操作'}
            </h3>
            <button
              onClick={previewUrl ? handleClosePreview : onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {previewUrl ? (
            <div className="flex-1 flex flex-col">
              <h4 className="text-lg font-medium text-gray-900 mb-4">{doc.title}</h4>
              <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  title="文档预览"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  使用 Microsoft Office Online 预览服务
                </span>
                <button
                  onClick={handleDownload}
                  className="bg-law-red-600 text-white py-2 px-6 rounded-lg hover:bg-law-red-700 transition-colors"
                >
                  下载文档
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{doc.title}</h4>
                <p className="text-gray-600">选择您想要的操作：</p>
              </div>

              <div className="space-y-4">
                <div className="bg-law-blue-50 border border-law-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-law-blue-800 mb-2">📄 在线预览</h5>
                  <p className="text-law-blue-600 text-sm mb-3">
                    使用 Microsoft Office Online 服务在线查看文档内容
                  </p>
                  <button
                    onClick={handlePreview}
                    disabled={isLoading}
                    className="w-full bg-law-blue-600 text-white py-2 px-4 rounded-lg hover:bg-law-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '加载中...' : '开始预览'}
                  </button>
                </div>
                
                <div className="bg-law-green-50 border border-law-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-law-green-800 mb-2">⬇️ 下载文档</h5>
                  <p className="text-law-green-600 text-sm mb-3">
                    将文档保存到本地，使用 Word 或其他软件查看
                  </p>
                  <button
                    onClick={handleDownload}
                    className="w-full bg-law-green-600 text-white py-2 px-4 rounded-lg hover:bg-law-green-700 transition-colors"
                  >
                    立即下载
                  </button>
                </div>
              </div>

              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>提示：</strong>在线预览需要网络连接，预览效果可能因浏览器而异。
                  如果预览无法加载，建议直接下载文档查看。
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview