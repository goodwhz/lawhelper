import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('=== Supabase 配置错误 ===')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'configured' : 'missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'configured' : 'missing')
}

// 创建带有自定义配置的Supabase客户端
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
    detectSessionInUrl: true,
    flowType: 'implicit', // 使用implicit流程，避免PKCE问题
    autoRefreshToken: true,
    debug: process.env.NODE_ENV === 'development',
  },
})

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
    console.log('=== 开始获取法律分类 ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const { data, error, status } = await supabase
      .from('law_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true, nullsFirst: false })

    console.log('分类查询结果:')
    console.log('- Status:', status)
    console.log('- Error:', error)
    console.log('- Data length:', data?.length || 0)

    if (error) {
      console.error('=== 获取分类失败 ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)

      // 根据错误类型提供更具体的错误信息
      if (error.code === 'PGRST116') {
        throw new Error('表 law_categories 不存在，请检查数据库结构')
      } else if (error.code === '42501') {
        throw new Error('没有访问 law_categories 表的权限，请检查 RLS 策略')
      } else if (error.code === 'JWT') {
        throw new Error('JWT token 无效或已过期，请检查 Supabase 密钥配置')
      } else {
        throw new Error(`获取分类失败: ${error.message} (代码: ${error.code})`)
      }
    }

    console.log(`=== 成功获取 ${data?.length || 0} 个分类 ===`)
    return data || []
  } catch (err: any) {
    console.error('=== getLawCategories 异常 ===')
    console.error('Error type:', err.constructor.name)
    console.error('Error message:', err.message)
    console.error('Stack:', err.stack)

    if (err.message.includes('fetch')) {
      throw new Error('网络连接失败，无法连接到 Supabase 数据库')
    }
    throw err
  }
}

// 根据分类ID获取法律文档
export async function getLawDocumentsByCategory(categoryId: string): Promise<LawDocument[]> {
  try {
    console.log(`=== 获取分类 ${categoryId} 的文档 ===`)

    const { data, error, status } = await supabase
      .from('law_documents')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_published', true) // 只获取已发布的文档
      .order('created_at', { ascending: false })

    console.log('文档查询结果:')
    console.log('- Status:', status)
    console.log('- Error:', error)
    console.log('- Data length:', data?.length || 0)

    if (error) {
      console.error('=== 获取文档失败 ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)

      if (error.code === 'PGRST116') {
        throw new Error('表 law_documents 不存在，请检查数据库结构')
      } else if (error.code === '42501') {
        throw new Error('没有访问 law_documents 表的权限，请检查 RLS 策略')
      } else {
        throw new Error(`获取文档失败: ${error.message} (代码: ${error.code})`)
      }
    }

    console.log(`=== 成功获取 ${data?.length || 0} 个文档 ===`)
    return data || []
  } catch (err: any) {
    console.error('=== getLawDocumentsByCategory 异常 ===')
    console.error('Error type:', err.constructor.name)
    console.error('Error message:', err.message)

    if (err.message.includes('fetch')) {
      throw new Error('网络连接失败，无法连接到 Supabase 数据库')
    }
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
