import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'documents', 'categories', 'conversations'
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 验证管理员权限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    let query = supabase.from('document_categories').select('*')

    switch (type) {
      case 'documents':
        query = supabase
          .from('legal_documents')
          .select(`
            *,
            category:document_categories(name, description),
            author:auth.users(email)
          `)

        if (category) {
          query = query.eq('category_id', category)
        }

        if (tag) {
          query = query.contains('tags', [tag])
        }

        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
        }

        query = query.order(sortBy as any, { ascending: sortOrder === 'asc' })
        break

      case 'categories':
        query = supabase
          .from('document_categories')
          .select(`
            *,
            parent:document_categories(name),
            children:document_categories(id, name)
          `)

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        query = query.order(sortBy as any, { ascending: sortOrder === 'asc' })
        break

      case 'conversations':
        query = supabase
          .from('conversations')
          .select(`
            *,
            user:auth.users(email),
            user_profiles:user_profiles(full_name)
          `)

        if (search) {
          query = query.or(`title.ilike.%${search}%`)
            .or(`user.email.ilike.%${search}%`)
        }

        query = query.order(sortBy as any, { ascending: sortOrder === 'asc' })
        break

      default:
        return NextResponse.json({ error: '无效的类型参数' }, { status: 400 })
    }

    // 应用分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('查询错误:', error)
      return NextResponse.json({ error: '查询失败' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { type, data: itemData, action } = body

    // 验证管理员权限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    let result

    switch (action) {
      case 'create':
        switch (type) {
          case 'documents':
            result = await supabase
              .from('legal_documents')
              .insert([{
                ...itemData,
                author_id: user.id,
                tags: Array.isArray(itemData.tags)
                  ? itemData.tags
                  : itemData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
              }])
            break
          case 'categories':
            result = await supabase
              .from('document_categories')
              .insert([itemData])
            break
          default:
            return NextResponse.json({ error: '无效的类型参数' }, { status: 400 })
        }
        break

      case 'update':
        switch (type) {
          case 'documents': {
            const updateData = {
              ...itemData,
              tags: Array.isArray(itemData.tags)
                ? itemData.tags
                : itemData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
            }
            result = await supabase
              .from('legal_documents')
              .update(updateData)
              .eq('id', itemData.id)
            break
          }
          case 'categories':
            result = await supabase
              .from('document_categories')
              .update(itemData)
              .eq('id', itemData.id)
            break
          default:
            return NextResponse.json({ error: '无效的类型参数' }, { status: 400 })
        }
        break

      case 'delete':
        switch (type) {
          case 'documents':
            if (Array.isArray(itemData.ids)) {
              result = await supabase
                .from('legal_documents')
                .delete()
                .in('id', itemData.ids)
            } else {
              result = await supabase
                .from('legal_documents')
                .delete()
                .eq('id', itemData.id)
            }
            break
          case 'categories':
            if (Array.isArray(itemData.ids)) {
              result = await supabase
                .from('document_categories')
                .delete()
                .in('id', itemData.ids)
            } else {
              result = await supabase
                .from('document_categories')
                .delete()
                .eq('id', itemData.id)
            }
            break
          default:
            return NextResponse.json({ error: '无效的类型参数' }, { status: 400 })
        }
        break

      case 'batchUpdate':
        if (type === 'documents' && Array.isArray(itemData.ids)) {
          result = await supabase
            .from('legal_documents')
            .update(itemData.updates)
            .in('id', itemData.ids)
        } else {
          return NextResponse.json({ error: '批量操作只支持文档类型' }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ error: '无效的操作类型' }, { status: 400 })
    }

    if (result.error) {
      console.error('操作错误:', result.error)
      return NextResponse.json({ error: '操作失败', details: result.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
