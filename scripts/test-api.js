const { createClient } = require('@supabase/supabase-js')

// 测试API调用
async function testApi() {
  try {
    console.log('测试API路径...')

    // 测试本地文件路径（旧格式）
    console.log('\\n1. 测试本地文件路径（应该失败）')
    const localResponse = await fetch('http://localhost:3000/api/law/地方性法规/上海市劳动合同条例_20011115.pdf')
    console.log('状态:', localResponse.status)

    // 测试Supabase路径（新格式）
    console.log('\\n2. 测试Supabase文件路径（应该成功）')
    const supabaseResponse = await fetch('http://localhost:3000/api/law/national-law/labor-law-20181229.pdf')
    console.log('状态:', supabaseResponse.status)

    if (supabaseResponse.ok) {
      const contentLength = supabaseResponse.headers.get('content-length')
      const contentType = supabaseResponse.headers.get('content-type')
      console.log('文件大小:', contentLength, 'bytes')
      console.log('Content-Type:', contentType)
    }
  } catch (error) {
    console.error('API测试失败:', error.message)
  }
}

// 直接测试Supabase连接
async function testSupabaseDirect() {
  try {
    console.log('\\n3. 直接测试Supabase Storage')

    const supabase = createClient(
      'https://duyfvvbgadrwaonvlrun.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
    )

    const { data, error } = await supabase.storage
      .from('law-documents')
      .download('national-law/labor-law-20181229.pdf')

    if (error) {
      console.error('Supabase直接获取失败:', error.message)
    } else {
      const buffer = Buffer.from(await data.arrayBuffer())
      console.log('✅ Supabase直接获取成功，文件大小:', buffer.length, 'bytes')
    }
  } catch (error) {
    console.error('Supabase直接测试失败:', error.message)
  }
}

async function main() {
  await testSupabaseDirect()
  await testApi()
}

main()
