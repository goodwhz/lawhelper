import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建服务端Supabase客户端，使用服务角色密钥绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase配置缺失:', {
    url: supabaseUrl ? '已配置' : '缺失',
    serviceKey: supabaseServiceRoleKey ? '已配置' : '缺失'
  })
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string

    if (!file || !title || !category) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过10MB' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 创建唯一的文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // 上传文件到Supabase存储
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('templates')
      .upload(fileName, file)

    if (uploadError) {
      console.error('文件上传失败:', uploadError)
      return NextResponse.json(
        { error: `文件上传失败: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 创建数据库记录
    const tagsArray = tags.split(/[,，]/).map((tag: string) => tag.trim()).filter((tag: string) => tag)
    
    const { data: insertData, error: insertError } = await supabase
      .from('document_templates')
      .insert([{
        title,
        description,
        category,
        file_name: fileName,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        tags: tagsArray,
        is_published: true,
        is_featured: false,
        download_count: 0
      }])
      .select()

    if (insertError) {
      console.error('数据库记录创建失败:', insertError)
      // 如果数据库插入失败，删除已上传的文件
      await supabase.storage.from('templates').remove([fileName])
      return NextResponse.json(
        { error: `数据库记录创建失败: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: insertData[0],
      message: '模板上传成功'
    })

  } catch (error) {
    console.error('模板上传失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}