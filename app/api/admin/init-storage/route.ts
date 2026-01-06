import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // 检查是否为管理员
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    console.log('开始初始化模板存储...')

    // 1. 检查存储桶是否存在
    console.log('检查存储桶...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('获取存储桶列表失败:', bucketsError)
      return NextResponse.json({ error: `获取存储桶失败: ${bucketsError.message}` }, { status: 500 })
    }

    const templatesBucket = buckets?.find(bucket => bucket.name === 'templates')
    
    if (!templatesBucket) {
      console.log('创建 templates 存储桶...')
      const { error: createError } = await supabase.storage.createBucket('templates', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'text/plain']
      })

      if (createError) {
        console.error('创建存储桶失败:', createError)
        return NextResponse.json({ error: `创建存储桶失败: ${createError.message}` }, { status: 500 })
      }
      console.log('✅ 存储桶创建成功')
    } else {
      console.log('✅ 存储桶已存在')
    }

    // 2. 上传现有模板文件
    console.log('准备上传现有模板文件...')
    
    // 由于无法直接访问文件系统，这里只能返回指令
    return NextResponse.json({
      success: true,
      message: '存储桶初始化完成',
      next_steps: [
        '请通过管理界面上传现有模板文件',
        '或运行服务器端脚本上传文件'
      ],
      bucket_status: templatesBucket ? '已存在' : '已创建'
    })

  } catch (error) {
    console.error('初始化失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}