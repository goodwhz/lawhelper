'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Navigation from '@/app/components/navigation'

export default function InitDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const initializeData = async () => {
    setLoading(true)
    setResult('正在初始化数据...')

    try {
      // 插入测试分类
      const { data: existingCategories } = await supabase
        .from('law_categories')
        .select('id, name')

      if (!existingCategories || existingCategories.length === 0) {
        const { error: categoriesError } = await supabase
          .from('law_categories')
          .insert([
            {
              id: 'cat-001',
              name: '民法',
              description: '民法相关法律文档',
              sort_order: 1,
              is_active: true,
            },
            {
              id: 'cat-002',
              name: '刑法',
              description: '刑法相关法律文档',
              sort_order: 2,
              is_active: true,
            },
            {
              id: 'cat-003',
              name: '行政法',
              description: '行政法相关法律文档',
              sort_order: 3,
              is_active: true,
            },
          ])

        if (categoriesError) {
          throw new Error(`插入分类失败: ${categoriesError.message}`)
        }
        setResult('✅ 分类插入成功')
      } else {
        setResult(`ℹ️ 已存在 ${existingCategories.length} 个分类`)
      }

      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 插入测试文档
      const { data: existingDocuments } = await supabase
        .from('law_documents')
        .select('id, title')

      if (!existingDocuments || existingDocuments.length === 0) {
        const { error: documentsError } = await supabase
          .from('law_documents')
          .insert([
            {
              id: 'doc-001',
              title: '中华人民共和国民法典总则',
              content: '《中华人民共和国民法典》总则编是民法典的开篇部分，规定了民法典的基本原则、民事主体、民事权利能力、民事行为能力等基本制度。总则编共204条，涵盖了民事活动的基本规则。',
              category_id: 'cat-001',
              document_type: '法律条文',
              document_number: 'GB-2020-001',
              is_published: true,
              is_featured: true,
              tags: ['民法典', '总则', '基本制度'],
              keywords: ['民事主体', '权利能力', '行为能力'],
              view_count: 0,
              download_count: 0,
            },
            {
              id: 'doc-002',
              title: '刑法基本原则',
              content: '刑法的基本原则包括罪刑法定原则、法律面前人人平等原则、罪责刑相适应原则。这些原则贯穿于整个刑法体系，是刑法适用的重要指导原则。',
              category_id: 'cat-002',
              document_type: '法律条文',
              document_number: 'CL-1997-001',
              is_published: true,
              is_featured: false,
              tags: ['刑法', '基本原则', '罪刑法定'],
              keywords: ['罪刑法定', '人人平等', '罪责刑相适应'],
              view_count: 0,
              download_count: 0,
            },
            {
              id: 'doc-003',
              title: '劳动合同法概述',
              content: '《中华人民共和国劳动合同法》是为了完善劳动合同制度，明确劳动合同双方当事人的权利和义务，保护劳动者的合法权益，构建和发展和谐稳定的劳动关系而制定的法律。',
              category_id: 'cat-003',
              document_type: '法律条文',
              document_number: 'LAB-2008-001',
              is_published: false, // 这个设为草稿
              is_featured: false,
              tags: ['劳动合同', '劳动者权益', '劳动关系'],
              keywords: ['劳动合同', '劳动者', '用人单位'],
              view_count: 0,
              download_count: 0,
            },
          ])

        if (documentsError) {
          throw new Error(`插入文档失败: ${documentsError.message}`)
        }
        setResult(prev => `${prev}\n✅ 文档插入成功`)
      } else {
        setResult(prev => `${prev}\nℹ️ 已存在 ${existingDocuments.length} 个文档`)
      }

      setResult(prev => `${prev}\n🎉 数据初始化完成！您现在可以访问 /admin 页面查看内容管理功能了。`)
    } catch (error) {
      console.error('数据初始化失败:', error)
      setResult(`❌ 错误: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">初始化测试数据</h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">说明</h2>
              <p className="text-blue-700">
                此页面用于初始化内容管理功能的测试数据。如果您已经配置好了数据库表，点击下面的按钮来插入一些测试文档和分类。
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={initializeData}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '正在初始化...' : '初始化测试数据'}
              </button>
            </div>

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">结果:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                  {result}
                </pre>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">后续操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/admin"
                  className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center"
                >
                  <div className="text-lg font-medium text-gray-900">📚 后台管理</div>
                  <div className="text-sm text-gray-600 mt-1">访问内容管理功能</div>
                </a>
                <a
                  href="/documents"
                  className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center"
                >
                  <div className="text-lg font-medium text-gray-900">📄 文档浏览</div>
                  <div className="text-sm text-gray-600 mt-1">查看已发布的文档</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
