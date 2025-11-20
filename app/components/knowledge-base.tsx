'use client'

import React, { useState, useEffect, useCallback } from 'react'
import DocumentPreview from './document-preview'

interface LawCategory {
  id: string
  name: string
  sort_order: number
  created_at: string
}

interface LawDocument {
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
}

interface LawDocumentWithCategory extends LawDocument {
  category_name: string
}

interface LoadDataOptions {
  retryCount?: number
}

const MAX_RETRY_COUNT = 3

const KnowledgeBase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<LawDocumentWithCategory | null>(null)
  const [lawDocuments, setLawDocuments] = useState<LawDocumentWithCategory[]>([])
  const [categories, setCategories] = useState<LawCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // 加载数据的函数
  const loadData = useCallback(async (options: LoadDataOptions = {}) => {
    try {
      setLoading(true)
      setError(null)

      console.log('=== 开始加载法律数据 ===')
      console.log('Selected category:', selectedCategory)
      console.log('Search term:', searchTerm)

      // 使用 API 获取数据
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory)
      }
      if (searchTerm?.trim()) {
        params.append('searchTerm', searchTerm)
      }

      const response = await fetch(`/api/law-data?${params.toString()}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API 请求失败:', response.status, errorText)
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const result = await response.json()
      console.log('API 响应:', result)

      if (!result.success) {
        throw new Error(result.error || '数据加载失败')
      }

      setCategories(result.data.categories)
      setLawDocuments(result.data.documents)

      // 重置重试计数
      setRetryCount(0)
      
      console.log(`成功加载 ${result.data.categories.length} 个分类, ${result.data.documents.length} 个文档`)
    } catch (err: any) {
      console.error('Error loading data:', err)

      // 根据错误类型显示不同的错误信息
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('网络连接失败，请检查网络连接后重试')
      } else if (err.message?.includes('JWT')) {
        setError('身份验证失败，请刷新页面后重试')
      } else if (err.message?.includes('RLS')) {
        setError('数据库访问权限问题，请联系管理员')
      } else {
        setError(`数据加载失败: ${err.message}`)
      }

      // 增加重试计数
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm])

  // 重试函数
  const handleRetry = () => {
    if (retryCount < MAX_RETRY_COUNT) {
      loadData({ retryCount: retryCount + 1 })
    } else {
      // 超过最大重试次数，显示最终错误
      setError('数据加载失败，请刷新页面后重试')
    }
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  const handleViewDocument = (doc: LawDocumentWithCategory) => {
    setSelectedDocument(doc)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedDocument(null)
  }

  // 过滤文档（基于前端筛选）
  const filteredDocuments = lawDocuments.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category_id === selectedCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      || doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
              <button
                key="all"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === 'all'
                    ? 'bg-law-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                全部
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    selectedCategory === category.id
                      ? 'bg-law-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-law-red-100 border-t-law-red-600 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-lg text-gray-600 mb-2">正在加载法律法规数据...</p>
            <p className="text-sm text-gray-500">请稍候，我们正在为您准备最新的法律资源</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {retryCount < MAX_RETRY_COUNT && (
                    <p className="mt-1 text-xs text-red-600">
                      已重试 {retryCount} 次，最多可重试 {MAX_RETRY_COUNT} 次
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex space-x-3">
                    {retryCount < MAX_RETRY_COUNT
                      ? (
                        <button
                          onClick={handleRetry}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50"
                        >
                          重试加载
                        </button>
                      )
                      : (
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50"
                        >
                          刷新页面
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 文档列表 */}
        {!loading && !error && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-law-blue-100 text-law-blue-800 text-sm rounded-full">
                        {doc.category_name}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-gray-600 mb-4 flex-1 text-sm line-clamp-3">
                      {doc.content.length > 150 ? `${doc.content.substring(0, 150)}...` : doc.content}
                    </p>
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
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {searchTerm.trim() ? '未找到相关法律法规' : '暂无可用文档'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm.trim()
                      ? `没有找到包含"${searchTerm}"的法律法规，请尝试其他关键词`
                      : '当前分类下暂无法律法规文档，请选择其他分类查看'
                    }
                  </p>
                  {searchTerm.trim() && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="bg-law-red-600 text-white px-4 py-2 rounded-lg hover:bg-law-red-700 transition-colors"
                    >
                      清除搜索条件
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
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
