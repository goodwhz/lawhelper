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
      
      // 创建预览页面URL，传递文件名作为参数
      const previewUrl = `/preview?file=${encodeURIComponent(fileName)}&title=${encodeURIComponent(doc.title)}`
      
      // 在新窗口打开预览页面
      const previewWindow = window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
      
      if (!previewWindow) {
        // 如果弹窗被阻止，提示用户允许弹窗
        alert('浏览器阻止了新窗口打开，请允许弹窗或手动点击下载按钮。')
        handleDownload()
      }
      
    } catch (error) {
      console.error('预览错误:', error)
      alert('预览功能暂时不可用，请下载后查看。')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">文档操作</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{doc.title}</h4>
            <p className="text-gray-600">选择您想要的操作：</p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">📄 在线预览</h5>
              <p className="text-blue-600 text-sm mb-3">
                在新窗口中打开文档进行预览
              </p>
              <button
                onClick={handlePreview}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '加载中...' : '开始预览'}
              </button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">⬇️ 下载文档</h5>
              <p className="text-green-600 text-sm mb-3">
                将文档保存到本地，使用 Word 或其他软件查看
              </p>
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                立即下载
              </button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>提示：</strong>如果浏览器阻止了新窗口打开，请允许弹窗或直接下载文档查看。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview