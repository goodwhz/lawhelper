import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_iFuGawfaXjf4aGic61EgIg_FPEMcqed'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface LawDocument {
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

export interface LawCategory {
  id: string
  name: string
  sort_order: number
  created_at: string
}

// 获取所有法律分类
export async function getLawCategories(): Promise<LawCategory[]> {
  try {
    console.log('Fetching law categories...')
    const { data, error } = await supabase
      .from('law_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error(`获取分类失败: ${error.message}`)
    }

    console.log(`Successfully fetched ${data?.length || 0} categories`)
    return data || []
  } catch (err) {
    console.error('getLawCategories error:', err)
    throw err
  }
}

// 根据分类ID获取法律文档
export async function getLawDocumentsByCategory(categoryId: string): Promise<LawDocument[]> {
  try {
    console.log(`Fetching documents for category: ${categoryId}`)
    const { data, error } = await supabase
      .from('law_documents')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_published', true) // 只获取已发布的文档
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents by category:', error)
      throw new Error(`获取文档失败: ${error.message}`)
    }

    console.log(`Successfully fetched ${data?.length || 0} documents for category ${categoryId}`)
    return data || []
  } catch (err) {
    console.error('getLawDocumentsByCategory error:', err)
    throw err
  }
}

// 搜索法律文档
export async function searchLawDocuments(query: string): Promise<LawDocument[]> {
  try {
    console.log(`Searching documents with query: ${query}`)
    const { data, error } = await supabase
      .from('law_documents')
      .select('*')
      .eq('is_published', true) // 只搜索已发布的文档
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error searching documents:', error)
      throw new Error(`搜索失败: ${error.message}`)
    }

    console.log(`Search found ${data?.length || 0} results for query: ${query}`)
    return data || []
  } catch (err) {
    console.error('searchLawDocuments error:', err)
    throw err
  }
}
