'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'

// 使用现有的 LawDocument 接口，并扩展以适应内容管理
interface Document {
  id: string
  title: string
  content: string
  category_id: string | null
  author_id?: string
  tags: string[] | null
  created_at: string
  updated_at: string
  published?: boolean
  // 兼容现有 law_documents 表的字段
  document_type?: string
  document_number?: string | null
  publish_date?: string | null
  effective_date?: string | null
  expire_date?: string | null
  file_path?: string | null
  file_size?: number | null
  file_type?: string | null
  download_count?: number
  view_count?: number
  is_published?: boolean
  is_featured?: boolean
  keywords?: string[] | null
}

interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string | null
  created_at: string
  // 兼容现有 law_categories 表的字段
  sort_order?: number
  is_active?: boolean
}

interface User {
  id: string
  email: string
  created_at: string
  user_profiles?: {
    full_name: string
    role: string
  }
}

export default function ProvisionManagement() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'documents' | 'categories'>('documents')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // 批量选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title?: string
    message: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    isLoading: false,
  })

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('开始加载数据...')

      const [documentsRes, categoriesRes] = await Promise.all([
        // 从现有的 law_documents 表读取数据
        supabase.from('law_documents').select('*'),
        // 从现有的 law_categories 表读取数据
        supabase.from('law_categories').select('*'),
      ])

      console.log('数据库查询结果:', {
        documents: {
          data: documentsRes.data,
          error: documentsRes.error,
          count: documentsRes.data?.length || 0,
        },
        categories: {
          data: categoriesRes.data,
          error: categoriesRes.error,
          count: categoriesRes.data?.length || 0,
        },
      })

      if (documentsRes.error) {
        console.error('文档查询错误:', documentsRes.error)
      } else {
        console.log(`成功加载 ${documentsRes.data?.length || 0} 个文档`)
        setDocuments(documentsRes.data || [])
      }

      if (categoriesRes.error) {
        console.error('分类查询错误:', categoriesRes.error)
      } else {
        console.log(`成功加载 ${categoriesRes.data?.length || 0} 个分类`)
        setCategories(categoriesRes.data || [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 执行搜索
  const handleSearch = () => {
    setSearchQuery(searchTerm)
  }

  // 处理回车键搜索
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach((doc) => {
      doc.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [documents])

  // 过滤和排序数据
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => {
      // 处理搜索查询
      const searchLower = searchQuery.toLowerCase()
      const titleMatch = doc.title?.toLowerCase().includes(searchLower) || false
      const contentMatch = doc.content?.toLowerCase().includes(searchLower) || false
      const tagsMatch = doc.tags?.some(tag =>
        tag.toLowerCase().includes(searchLower),
      ) || false

      return titleMatch || contentMatch || tagsMatch
    })

    if (categoryFilter) {
      filtered = filtered.filter(doc => doc.category_id === categoryFilter)
    }

    if (tagFilter) {
      filtered = filtered.filter(doc => doc.tags?.includes(tagFilter))
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Document]
      let bValue = b[sortBy as keyof Document]
      const multiplier = sortOrder === 'asc' ? 1 : -1

      // 处理日期字符串比较
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const dateA = new Date(aValue).getTime()
        const dateB = new Date(bValue).getTime()
        if (!isNaN(dateA) && !isNaN(dateB)) {
          aValue = dateA
          bValue = dateB
        }
      }

      if (aValue === null || aValue === undefined) { return 1 * multiplier }
      if (bValue === null || bValue === undefined) { return -1 * multiplier }

      if (aValue < bValue) { return -1 * multiplier }
      if (aValue > bValue) { return 1 * multiplier }
      return 0
    })

    return filtered
  }, [documents, searchQuery, categoryFilter, tagFilter, sortBy, sortOrder])

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      || cat.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ).sort((a, b) => {
      const aValue = a[sortBy as keyof Category]
      const bValue = b[sortBy as keyof Category]
      const multiplier = sortOrder === 'asc' ? 1 : -1

      if (aValue === null) { return 1 * multiplier }
      if (bValue === null) { return -1 * multiplier }

      if (aValue < bValue) { return -1 * multiplier }
      if (aValue > bValue) { return 1 * multiplier }
      return 0
    })
  }, [categories, searchQuery, sortBy, sortOrder])

  // 文档操作
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)

  const saveDocument = async (formData: Partial<Document>) => {
    try {
      if (editingDocument) {
        await supabase
          .from('law_documents')
          .update(formData)
          .eq('id', editingDocument.id)
      } else {
        await supabase
          .from('law_documents')
          .insert([formData])
      }
      setShowDocumentForm(false)
      setEditingDocument(null)
      loadData()
    } catch (error) {
      console.error('保存文档失败:', error)
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await supabase.from('law_documents').delete().eq('id', id)
      loadData()
    } catch (error) {
      console.error('删除文档失败:', error)
    }
  }

  const batchDeleteDocuments = async (ids: string[]) => {
    try {
      await supabase.from('law_documents').delete().in('id', ids)
      setSelectedItems([])
      setSelectAll(false)
      loadData()
    } catch (error) {
      console.error('批量删除文档失败:', error)
    }
  }

  const batchUpdateDocuments = async (ids: string[], updates: Partial<Document>) => {
    try {
      await supabase.from('law_documents').update(updates).in('id', ids)
      setSelectedItems([])
      setSelectAll(false)
      loadData()
    } catch (error) {
      console.error('批量更新文档失败:', error)
    }
  }

  // 分类操作
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const saveCategory = async (formData: Partial<Category>) => {
    try {
      if (editingCategory) {
        await supabase
          .from('law_categories')
          .update(formData)
          .eq('id', editingCategory.id)
      } else {
        await supabase
          .from('law_categories')
          .insert([{
            ...formData,
            sort_order: formData.sort_order || 0,
            is_active: formData.is_active !== false,
          }])
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      loadData()
    } catch (error) {
      console.error('保存分类失败:', error)
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await supabase.from('law_categories').delete().eq('id', id)
      loadData()
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  }

  const batchDeleteCategories = async (ids: string[]) => {
    try {
      await supabase.from('law_categories').delete().in('id', ids)
      setSelectedItems([])
      setSelectAll(false)
      loadData()
    } catch (error) {
      console.error('批量删除分类失败:', error)
    }
  }

  // 选择/取消选择项目
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id],
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    const currentItems = activeTab === 'documents'
      ? filteredDocuments
      : filteredCategories

    if (selectAll) {
      setSelectedItems([])
    } else {
      setSelectedItems(currentItems.map(item => item.id))
    }
    setSelectAll(!selectAll)
  }

  // 批量操作
  const handleBatchOperation = (operation: string, value?: any) => {
    const itemCount = selectedItems.length
    let message = ''
    let onConfirm = () => {}

    switch (operation) {
      case 'delete':
        message = `确定要删除选中的 ${itemCount} 个${activeTab === 'documents' ? '文档' : '分类'}吗？此操作不可撤销！`
        onConfirm = () => {
          if (activeTab === 'documents') { batchDeleteDocuments(selectedItems) }
          else { batchDeleteCategories(selectedItems) }
        }
        break
      case 'publish':
        message = `确定要发布选中的 ${itemCount} 个文档吗？`
        onConfirm = () => batchUpdateDocuments(selectedItems, { published: true })
        break
      case 'unpublish':
        message = `确定要取消发布选中的 ${itemCount} 个文档吗？`
        onConfirm = () => batchUpdateDocuments(selectedItems, { published: false })
        break
      case 'addTag':
        message = `确定要为选中的 ${itemCount} 个文档添加标签 "${value}" 吗？`
        onConfirm = () => {
          selectedItems.forEach(async (docId) => {
            const doc = documents.find(d => d.id === docId)
            if (doc && !doc.tags.includes(value)) {
              await batchUpdateDocuments([docId], {
                tags: [...doc.tags, value],
              })
            }
          })
        }
        break
    }

    setConfirmDialog({
      isOpen: true,
      title: '批量操作确认',
      message,
      onConfirm,
      type: operation === 'delete' ? 'danger' : 'warning',
    })
  }

  // 检查权限
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">权限不足</div>
          <div className="text-gray-500">您需要管理员权限才能访问此页面</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 高级搜索栏 - 移动端优化 */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="space-y-3 lg:space-y-4">
          {/* 搜索框 */}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索文档、分类、对话或用户..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-4 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="mobile-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors touch-target font-medium"
            >
              搜索
            </button>
          </div>

          {/* 高级过滤选项 - 移动端网格布局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {activeTab === 'documents' && (
              <>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
                >
                  <option value="">所有分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={tagFilter}
                  onChange={e => setTagFilter(e.target.value)}
                  className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
                >
                  <option value="">所有标签</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </>
            )}

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setSortBy(sortBy)
                setSortOrder(sortOrder as 'asc' | 'desc')
              }}
              className="px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
            >
              {activeTab === 'documents' && (
                <>
                  <option value="created_at-desc">创建时间 ↓</option>
                  <option value="created_at-asc">创建时间 ↑</option>
                  <option value="updated_at-desc">更新时间 ↓</option>
                  <option value="updated_at-asc">更新时间 ↑</option>
                  <option value="title-asc">标题 A-Z</option>
                  <option value="title-desc">标题 Z-A</option>
                </>
              )}
              {activeTab === 'categories' && (
                <>
                  <option value="name-asc">名称 A-Z</option>
                  <option value="name-desc">名称 Z-A</option>
                  <option value="created_at-desc">创建时间 ↓</option>
                  <option value="created_at-asc">创建时间 ↑</option>
                </>
              )}

            </select>
          </div>
        </div>
      </div>

      {/* 批量操作栏 - 移动端优化 */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-blue-800 mobile-text-base font-medium">
              已选择 {selectedItems.length} 个{activeTab === 'documents' ? '文档' : '分类'}
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              {activeTab === 'documents' && (
                <>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBatchOperation('addTag', e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="px-3 py-2 text-base mobile-text-base border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
                  >
                    <option value="">批量添加标签...</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBatchOperation('publish')}
                    className="mobile-ripple px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors touch-target font-medium"
                  >
                    批量发布
                  </button>
                  <button
                    onClick={() => handleBatchOperation('unpublish')}
                    className="mobile-ripple px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors touch-target font-medium"
                  >
                    批量取消发布
                  </button>
                </>
              )}
              <button
                onClick={() => handleBatchOperation('delete')}
                className="mobile-ripple px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors touch-target font-medium"
              >
                批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab导航 - 移动端优化 */}
      <div className="bg-white rounded-lg shadow">
        {/* 移动端Tab - 垂直卡片布局 */}
        <div className="lg:hidden p-3">
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`mobile-ripple p-4 rounded-lg border-2 text-left touch-target ${
                activeTab === 'documents'
                  ? 'border-law-blue-500 bg-law-blue-50 text-law-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <div className="font-medium">文档管理</div>
                    <div className="text-sm opacity-75">{filteredDocuments.length} 个文档</div>
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`mobile-ripple p-4 rounded-lg border-2 text-left touch-target ${
                activeTab === 'categories'
                  ? 'border-law-blue-500 bg-law-blue-50 text-law-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🏷️</div>
                  <div>
                    <div className="font-medium">分类管理</div>
                    <div className="text-sm opacity-75">{filteredCategories.length} 个分类</div>
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* 桌面端Tab - 水平布局 */}
        <div className="hidden lg:block border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📄 文档管理 ({filteredDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏷️ 分类管理 ({filteredCategories.length})
            </button>

          </nav>
        </div>

        <div className="p-6">
          {/* 文档管理 */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">法律文档</h3>
                <button
                  onClick={() => {
                    setEditingDocument(null)
                    setShowDocumentForm(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + 添加文档
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">全选</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    共 {filteredDocuments.length} 个文档
                  </span>
                </div>

                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(doc.id)}
                          onChange={() => toggleItemSelection(doc.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{doc.title}</h4>
                            {doc.is_published === false && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                草稿
                              </span>
                            )}
                            {doc.is_featured && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                精选
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.content}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span>
                              分类: {categories.find(c => c.id === doc.category_id)?.name || '未分类'}
                            </span>
                            {doc.document_type && (
                              <span>
                                类型: {doc.document_type}
                              </span>
                            )}
                            {doc.document_number && (
                              <span>
                                文档号: {doc.document_number}
                              </span>
                            )}
                            <span>
                              创建时间: {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              更新时间: {new Date(doc.updated_at).toLocaleDateString()}
                            </span>
                            {doc.view_count !== undefined && (
                              <span>
                                查看次数: {doc.view_count}
                              </span>
                            )}
                            {doc.download_count !== undefined && (
                              <span>
                                下载次数: {doc.download_count}
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {doc.tags?.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingDocument(doc)
                            setShowDocumentForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: '删除文档',
                              message: `确定要删除文档 "${doc.title}" 吗？此操作不可撤销！`,
                              onConfirm: () => deleteDocument(doc.id),
                              type: 'danger',
                            })
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 分类管理 */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">文档分类</h3>
                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setShowCategoryForm(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + 添加分类
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">全选</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    共 {filteredCategories.length} 个分类
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map(category => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(category.id)}
                            onChange={() => toggleItemSelection(category.id)}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category)
                              setShowCategoryForm(true)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: '删除分类',
                                message: `确定要删除分类 "${category.name}" 吗？此操作不可撤销！`,
                                onConfirm: () => deleteCategory(category.id),
                                type: 'danger',
                              })
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {category.parent_id ? '子分类' : '主分类'}
                        </span>
                        <span>
                          创建时间: {new Date(category.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 文档表单弹窗 */}
      {showDocumentForm && (
        <DocumentForm
          document={editingDocument}
          categories={categories}
          onSave={saveDocument}
          onCancel={() => {
            setShowDocumentForm(false)
            setEditingDocument(null)
          }}
        />
      )}

      {/* 分类表单弹窗 */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSave={saveCategory}
          onCancel={() => {
            setShowCategoryForm(false)
            setEditingCategory(null)
          }}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
        type={confirmDialog.type}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  )
}

// 文档表单组件
function DocumentForm({
  document,
  categories,
  onSave,
  onCancel,
}: {
  document: Document | null
  categories: Category[]
  onSave: (data: Partial<Document>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: document?.title || '',
    content: document?.content || '',
    category_id: document?.category_id || '',
    tags: document?.tags?.join(', ') || '',
    is_published: document?.is_published ?? true,
    document_type: document?.document_type || '',
    document_number: document?.document_number || '',
    is_featured: document?.is_featured ?? false,
    keywords: document?.keywords?.join(', ') || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mobile-scrollbar-hide">
        <h3 className="text-lg lg:text-lg font-semibold mb-4">
          {document ? '编辑文档' : '添加文档'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
                required
              >
                <option value="">选择分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文档类型
              </label>
              <input
                type="text"
                value={formData.document_type}
                onChange={e => setFormData({ ...formData, document_type: e.target.value })}
                placeholder="例如: 法律条文、案例解析"
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文档编号
              </label>
              <input
                type="text"
                value={formData.document_number}
                onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                placeholder="例如: GB-2024-001"
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签 (用逗号分隔)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="例如: 民法, 合同, 侵权"
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关键词 (用逗号分隔)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={e => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="例如: 合同纠纷, 民事责任, 侵权责任"
              className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                发布文档
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                设为精选
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
            <button
              type="submit"
              className="mobile-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-target font-medium"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mobile-ripple px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 touch-target font-medium"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 分类表单组件
function CategoryForm({
  category,
  categories,
  onSave,
  onCancel,
}: {
  category: Category | null
  categories: Category[]
  onSave: (data: Partial<Category>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent_id: category?.parent_id || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active !== false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
        <h3 className="text-lg lg:text-lg font-semibold mb-4">
          {category ? '编辑分类' : '添加分类'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序顺序
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="数字越小排序越靠前"
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                父分类
              </label>
              <select
                value={formData.parent_id}
                onChange={e => setFormData({ ...formData, parent_id: e.target.value || '' })}
                className="w-full px-3 py-2 text-base mobile-text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-target"
              >
                <option value="">无 (主分类)</option>
                {categories
                  .filter(cat => cat.id !== category?.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                启用分类
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
            <button
              type="submit"
              className="mobile-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-target font-medium"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mobile-ripple px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 touch-target font-medium"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
