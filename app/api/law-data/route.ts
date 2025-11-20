import { NextResponse } from 'next/server'
import { getLawCategories, getLawDocumentsByCategory, searchLawDocuments } from '../../../lib/supabaseClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const searchTerm = searchParams.get('searchTerm')

    console.log('=== API: 获取法律数据 ===')
    console.log('Category ID:', categoryId)
    console.log('Search term:', searchTerm)

    // 获取所有分类
    const categories = await getLawCategories()

    let documents: any[] = []

    if (searchTerm?.trim()) {
      // 搜索模式
      console.log('搜索模式:', searchTerm)
      const searchResults = await searchLawDocuments(searchTerm)

      // 获取分类名称
      documents = searchResults.map((doc) => {
        const category = categories.find(cat => cat.id === doc.category_id)
        return {
          ...doc,
          category_name: category?.name || '未知分类',
        }
      })
    } else if (categoryId === 'all' || !categoryId) {
      // 获取所有分类的文档
      for (const category of categories) {
        const categoryDocs = await getLawDocumentsByCategory(category.id)
        const docsWithCategory = categoryDocs.map(doc => ({
          ...doc,
          category_name: category.name,
        }))
        documents.push(...docsWithCategory)
      }
    } else {
      // 获取特定分类的文档
      const category = categories.find(cat => cat.id === categoryId)
      if (category) {
        const categoryDocs = await getLawDocumentsByCategory(category.id)
        documents = categoryDocs.map(doc => ({
          ...doc,
          category_name: category.name,
        }))
      }
    }

    console.log(`返回 ${categories.length} 个分类, ${documents.length} 个文档`)

    return NextResponse.json({
      success: true,
      data: {
        categories,
        documents,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
      },
    })
  } catch (error: any) {
    console.error('API 获取法律数据失败:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
