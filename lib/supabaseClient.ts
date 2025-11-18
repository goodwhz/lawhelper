import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duyfvvbgadrwaonvlrun.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0'

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
  const { data, error } = await supabase
    .from('law_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) { throw error }
  return data || []
}

// 根据分类ID获取法律文档
export async function getLawDocumentsByCategory(categoryId: string): Promise<LawDocument[]> {
  const { data, error } = await supabase
    .from('law_documents')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_published', true) // 只获取已发布的文档
    .order('created_at', { ascending: false })

  if (error) { throw error }
  return data || []
}

// 搜索法律文档
export async function searchLawDocuments(query: string): Promise<LawDocument[]> {
  const { data, error } = await supabase
    .from('law_documents')
    .select('*')
    .eq('is_published', true) // 只搜索已发布的文档
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { throw error }
  return data || []
}
