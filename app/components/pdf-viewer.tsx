'use client'

import React, { useState, useEffect } from 'react'

interface PdfViewerProps {
  fileUrl: string
  title: string
}

const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>('')

  useEffect(() => {
    // 构建PDF文件的URL
    const url = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    setPdfUrl(url)

    // 模拟加载完成
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [fileUrl])

  const handleLoadError = () => {
    setError('无法加载PDF文件，请尝试下载后查看')
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">正在加载PDF文件...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          在新窗口中打开
        </a>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">{title}</p>
        <a
          href={pdfUrl}
          download={title}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          下载PDF
        </a>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
        <iframe
          src={pdfUrl}
          className="w-full h-full min-h-96"
          title={title}
          onError={handleLoadError}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          如果PDF无法正确显示，请尝试在浏览器中打开或下载后查看
        </p>
      </div>
    </div>
  )
}

export default PdfViewer
