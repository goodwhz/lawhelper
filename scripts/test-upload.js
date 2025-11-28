const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// 使用anon key先测试
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function testUpload() {
  try {
    console.log('测试Supabase Storage连接...')

    // 使用实际PDF文件测试
    const testFilePath = 'e:\\Workplace\\AI\\PBL2\\lawhelper\\law\\国家法律\\中华人民共和国劳动法_20181229.pdf'

    if (!fs.existsSync(testFilePath)) {
      console.error('测试文件不存在:', testFilePath)
      return
    }

    const fileBuffer = fs.readFileSync(testFilePath)
    console.log('文件大小:', fileBuffer.length, 'bytes')

    // 使用英文路径名上传
    const uploadPath = 'national-law/labor-law-20181229.pdf'

    // 上传文件
    const { data, error } = await supabase.storage
      .from('law-documents')
      .upload(uploadPath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error('上传测试失败:', error)
    } else {
      console.log('上传测试成功:', data)

      // 测试获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('law-documents')
        .getPublicUrl(uploadPath)

      console.log('公共访问URL:', publicUrl)
    }
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testUpload()
