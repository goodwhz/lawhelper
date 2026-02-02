'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'

interface DocumentTemplate {
  id: string
  title: string
  description: string
  category: string
  file_name: string
  file_path: string | null
  file_size: number
  file_type: string
  download_count: number
  is_published: boolean
  is_featured: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export default function TemplateManagement() {
  const { isAdmin } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 新增模板表单状态
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    file: null as File | null,
  })

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

  // 加载模板数据
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('加载模板失败:', error)
      } else {
        setTemplates(data || [])
      }
    } catch (error) {
      console.error('加载模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取所有分类
  const categories = Array.from(new Set(templates.map(t => t.category)))

  // 过滤和排序模板
  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
        || template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !categoryFilter || template.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof DocumentTemplate]
      const bValue = b[sortBy as keyof DocumentTemplate]
      const multiplier = sortOrder === 'asc' ? 1 : -1

      if (aValue === null || aValue === undefined) { return 1 * multiplier }
      if (bValue === null || bValue === undefined) { return -1 * multiplier }

      if (aValue < bValue) { return -1 * multiplier }
      if (aValue > bValue) { return 1 * multiplier }
      return 0
    })

  // 新增模板操作
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewTemplate(prev => ({
        ...prev,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // 使用文件名作为默认标题
        file_name: file.name,
      }))
    }
  }

  const handleAddTemplate = async () => {
    if (!newTemplate.title || !newTemplate.category || !newTemplate.file) {
      console.warn('请填写标题、分类并选择文件')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', newTemplate.file)
      formData.append('title', newTemplate.title)
      formData.append('description', newTemplate.description)
      formData.append('category', newTemplate.category)
      formData.append('tags', newTemplate.tags)

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '上传失败')
      }

      // 重置表单并重新加载数据
      setNewTemplate({
        title: '',
        description: '',
        category: '',
        tags: '',
        file: null,
      })
      setShowAddForm(false)

      // 重新加载模板列表
      await loadTemplates()

      console.log('模板添加成功！')
    } catch (error) {
      console.error('添加模板失败:', error)
      console.error(`添加模板失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setUploading(false)
    }
  }

  // 模板操作
  const togglePublish = async (templateId: string, published: boolean) => {
    try {
      await supabase
        .from('document_templates')
        .update({ is_published: !published })
        .eq('id', templateId)
      loadTemplates()
    } catch (error) {
      console.error('更新发布状态失败:', error)
    }
  }

  const toggleFeatured = async (templateId: string, featured: boolean) => {
    try {
      await supabase
        .from('document_templates')
        .update({ is_featured: !featured })
        .eq('id', templateId)
      loadTemplates()
    } catch (error) {
      console.error('更新精选状态失败:', error)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      await supabase
        .from('document_templates')
        .delete()
        .eq('id', templateId)
      loadTemplates()
    } catch (error) {
      console.error('删除模板失败:', error)
    }
  }

  const handleDownload = async (template: DocumentTemplate) => {
    try {
      // 增加下载计数
      await supabase
        .from('document_templates')
        .update({ download_count: (template.download_count || 0) + 1 })
        .eq('id', template.id)

      // 创建下载链接
      const link = document.createElement('a')
      link.href = `/api/template/${template.file_name}`
      link.download = template.file_name
      link.target = '_blank'

      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 重新加载数据以更新下载计数
      setTimeout(loadTemplates, 100)
    } catch (error) {
      console.error('下载失败:', error)
    }
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
      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索模板名称或描述..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setSortBy(sortBy)
                setSortOrder(sortOrder as 'asc' | 'desc')
              }}
              className="px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">创建时间 ↓</option>
              <option value="created_at-asc">创建时间 ↑</option>
              <option value="title-asc">标题 A-Z</option>
              <option value="title-desc">标题 Z-A</option>
              <option value="download_count-desc">下载次数 ↓</option>
              <option value="download_count-asc">下载次数 ↑</option>
            </select>
          </div>

          {/* 新增模板按钮 */}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增模板
          </button>
        </div>
      </div>

      {/* 新增模板表单 */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">新增文书模板</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板文件 <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="template-file"
                />
                <label htmlFor="template-file" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2">
                    <span className="text-blue-600 font-medium">点击选择文件</span>
                    <span className="text-gray-500 text-sm block mt-1">支持 .doc, .docx, .pdf, .txt 格式</span>
                  </div>
                </label>
                {newTemplate.file && (
                  <div className="mt-2 text-sm text-green-600">
                    ✅ 已选择: {newTemplate.file.name} ({Math.round(newTemplate.file.size / 1024)} KB)
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入模板标题"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTemplate.category}
                  onChange={e => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  <option value="离职文书">离职文书</option>
                  <option value="解除合同">解除合同</option>
                  <option value="仲裁诉讼">仲裁诉讼</option>
                  <option value="工伤保险">工伤保险</option>
                  <option value="日常工作">日常工作</option>
                  <option value="工资争议">工资争议</option>
                  <option value="合同管理">合同管理</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板描述
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入模板描述和用途"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={newTemplate.tags}
                  onChange={e => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="例如：辞职,离职,文书"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddTemplate}
                  disabled={uploading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading
                    ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        上传中...
                      </>
                    )
                    : (
                      '确认添加'
                    )}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模板列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">文书模板管理</h3>
            <div className="text-sm text-gray-500">
              共 {filteredTemplates.length} 个模板
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => togglePublish(template.id, template.is_published)}
                      className={`text-xs px-2 py-1 rounded ${
                        template.is_published
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {template.is_published ? '已发布' : '草稿'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(template.id, template.is_featured)}
                      className={`text-xs px-2 py-1 rounded ${
                        template.is_featured
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {template.is_featured ? '精选' : '普通'}
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-lg mb-2">{template.title}</h4>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags?.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span>下载: {template.download_count}</span>
                  <span>大小: {Math.round(template.file_size / 1024)} KB</span>
                  <span>创建: {new Date(template.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(template)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    下载模板
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: '删除模板',
                        message: `确定要删除模板 "${template.title}" 吗？此操作不可撤销！`,
                        onConfirm: () => deleteTemplate(template.id),
                        type: 'danger',
                      })
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">未找到相关模板</p>
            </div>
          )}
        </div>
      </div>

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

// 分类颜色映射
function getCategoryColor(category: string) {
  const colors = {
    离职文书: 'bg-red-100 text-red-800',
    解除合同: 'bg-orange-100 text-orange-800',
    仲裁诉讼: 'bg-purple-100 text-purple-800',
    工伤保险: 'bg-blue-100 text-blue-800',
    日常工作: 'bg-green-100 text-green-800',
    工资争议: 'bg-yellow-100 text-yellow-800',
    合同管理: 'bg-indigo-100 text-indigo-800',
  }
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}
