import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    // 等待params解析
    const { filename } = await params
    const decodedFilename = decodeURIComponent(filename)

    // 构建文件路径 - 指向template文件夹
    const filePath = join(process.cwd(), 'template', decodedFilename)

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      console.error('模板文件不存在:', filePath)
      return NextResponse.json({ error: '模板文件不存在' }, { status: 404 })
    }

    // 读取文件内容
    const fileBuffer = readFileSync(filePath)

    // 根据文件扩展名设置Content-Type
    let contentType = 'application/octet-stream'
    if (decodedFilename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (decodedFilename.endsWith('.doc')) {
      contentType = 'application/msword'
    }

    // 提取文件名用于下载（不包含文件夹路径）
    const downloadFilename = decodedFilename.split('/').pop() || decodedFilename

    // 使用encodeURIComponent处理中文字符问题
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('模板文件下载错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
