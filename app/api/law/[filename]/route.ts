import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    // 等待params解析
    const { filename } = await params
    const decodedFilename = decodeURIComponent(filename)

    // 检查是否为Supabase存储路径（不包含反斜杠且符合英文路径格式）
    // 支持两种拼写，因为数据库中可能存在拼写错误的路径
    const isSupabasePath = !decodedFilename.includes('\\')
      && (decodedFilename.startsWith('national-law/')
        || decodedFilename.startsWith('national-administrative-regulations/')
        || decodedFilename.startsWith('national-administrative-regulations/')
        || decodedFilename.startsWith('local-regulations/'))

    let fileBuffer: Buffer
    let contentType = 'application/octet-stream'

    if (isSupabasePath) {
      // 从Supabase Storage获取文件
      console.log('从Supabase Storage获取文件:', decodedFilename)

      const { data, error } = await supabase.storage
        .from('law-documents')
        .download(decodedFilename)

      if (error) {
        console.error('Supabase文件获取失败:', error)
        return NextResponse.json({ error: '文件不存在' }, { status: 404 })
      }

      fileBuffer = Buffer.from(await data.arrayBuffer())
      console.log('成功从Supabase获取文件，大小:', fileBuffer.length, 'bytes')
    } else {
      // 从本地文件系统获取文件（向后兼容）
      const filePath = join(process.cwd(), 'law', decodedFilename)

      if (!existsSync(filePath)) {
        console.error('本地文件不存在:', filePath)
        return NextResponse.json({ error: '文件不存在' }, { status: 404 })
      }

      fileBuffer = readFileSync(filePath)
      console.log('成功从本地获取文件，大小:', fileBuffer.length, 'bytes')
    }

    // 根据文件扩展名设置Content-Type
    if (decodedFilename.endsWith('.pdf')) {
      contentType = 'application/pdf'
    } else if (decodedFilename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (decodedFilename.endsWith('.doc')) {
      contentType = 'application/msword'
    }

    // 提取文件名用于下载（不包含文件夹路径）
    const downloadFilename = decodedFilename.split('/').pop() || decodedFilename

    // 根据文件类型设置不同的Content-Disposition
    // 对于PDF文件，如果是预览请求则使用inline，否则使用attachment
    const url = new URL(request.url)
    const isPreview = url.searchParams.get('preview') === 'true'
    const dispositionType = isPreview && decodedFilename.endsWith('.pdf') ? 'inline' : 'attachment'

    // 设置Content-Disposition，支持中英文文件名
    const encodedFilename = encodeURIComponent(downloadFilename)
    let contentDisposition = `${dispositionType}; filename="${encodedFilename}"`

    // 添加RFC 2231格式的文件名编码，以支持更多浏览器
    contentDisposition += `; filename*=UTF-8''${encodedFilename}`

    // 返回文件
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('文件下载错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}