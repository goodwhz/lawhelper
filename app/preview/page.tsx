'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const fileName = searchParams.get('file')
  const title = searchParams.get('title') || '文档预览'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')

  useEffect(() => {
    if (!fileName) {
      setError('未指定要预览的文件')
      setIsLoading(false)
      return
    }

    loadAndConvertDocument()
  }, [fileName])

  const loadAndConvertDocument = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 获取文档内容
      const response = await fetch(`/api/law/${encodeURIComponent(fileName || '')}`)
      if (!response.ok) {
        throw new Error('文档加载失败')
      }

      const blob = await response.blob()

      // 动态导入 mammoth.js
      const mammoth = await import('mammoth')

      // 使用 mammoth 转换 Word 文档为 HTML
      const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() })

      // 设置转换后的 HTML 内容
      setHtmlContent(result.value)
      setIsLoading(false)
    } catch (error) {
      console.error('文档转换错误:', error)
      setError('文档预览功能暂时不可用，请下载后查看。')
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (fileName) {
      const downloadUrl = `/api/law/${encodeURIComponent(fileName)}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = title + (fileName.endsWith('.docx') ? '.docx' : '.doc')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleBack = () => {
    // 尝试关闭窗口（如果是弹窗），否则返回上一页
    if (window.opener && !window.opener.closed) {
      window.close()
    } else {
      window.history.back()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在转换文档...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">预览错误</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                下载文档
              </button>
              <button
                onClick={handleBack}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                返回
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                下载原文档
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">文档预览</h2>
            <p className="text-sm text-gray-600 mt-1">
              使用 Mammoth.js 转换的 HTML 预览（支持表格、列表、段落等格式）
            </p>
          </div>

          <div className="p-8 prose prose-lg max-w-none">
            {htmlContent
              ? (
                <div
                  className="document-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )
              : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600">文档内容为空</p>
                </div>
              )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">💡 技术说明</h3>
          <p className="text-blue-700 text-sm">
            • 使用 <strong>Mammoth.js</strong> 库将 Word 文档转换为 HTML 格式<br/>
            • 支持表格、列表、段落等基本格式的渲染<br/>
            • 纯前端实现，无需服务器支持<br/>
            • 如果转换效果不理想，可下载原文档使用专业软件查看
          </p>
        </div>
      </div>
    </div>
  )
}
