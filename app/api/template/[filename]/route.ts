import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // 首先从数据库获取模板信息
    const { data: templateData, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('file_name', filename)
      .single()

    if (templateError || !templateData) {
      // 如果没有找到数据库记录，尝试从本地文件系统查找（向后兼容）
      const fs = require('fs')
      const path = require('path')
      
      const filePath = path.join(process.cwd(), 'template', filename)
      
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath)
        const stats = fs.statSync(filePath)
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/msword',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': stats.size.toString(),
          },
        })
      }
      
      return NextResponse.json(
        { error: '模板文件不存在' },
        { status: 404 }
      )
    }

    // 从Supabase存储下载文件
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('templates')
      .download(filename)

    if (downloadError) {
      console.error('文件下载失败:', downloadError)
      return NextResponse.json(
        { error: '文件下载失败' },
        { status: 500 }
      )
    }

    // 更新下载计数
    await supabase
      .from('document_templates')
      .update({ download_count: (templateData.download_count || 0) + 1 })
      .eq('id', templateData.id)

    // 将文件转换为ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': templateData.file_type || 'application/msword',
        'Content-Disposition': `attachment; filename="${templateData.title}.${filename.split('.').pop()}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('模板下载失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}