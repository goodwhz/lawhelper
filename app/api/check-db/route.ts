import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== 检查数据库结构 ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 配置不完整',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      }, { status: 500 })
    }

    // 检查表是否存在
    const tables = ['law_categories', 'law_documents']
    const results: any = {}

    for (const tableName of tables) {
      try {
        console.log(`检查表: ${tableName}`)

        // 尝试获取表结构信息
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Accept: 'application/json',
            Prefer: 'count=exact',
          },
        })

        console.log(`${tableName} 响应状态:`, response.status)
        console.log(`${tableName} 响应头:`, Object.fromEntries(response.headers.entries()))

        if (response.ok) {
          const countHeader = response.headers.get('content-range')
          const count = countHeader ? countHeader.split('/')[1] : '0'

          results[tableName] = {
            exists: true,
            accessible: true,
            count: parseInt(count) || 0,
            error: null,
          }

          // 如果有数据，获取一条示例记录查看结构
          if (parseInt(count) > 0) {
            const data = await response.json()
            results[tableName].sample = data[0] || null
          }
        } else {
          const errorText = await response.text()
          console.error(`${tableName} 查询失败:`, errorText)

          results[tableName] = {
            exists: response.status !== 404,
            accessible: false,
            count: 0,
            error: `${response.status}: ${errorText}`,
          }
        }
      } catch (error: any) {
        console.error(`${tableName} 检查异常:`, error)
        results[tableName] = {
          exists: false,
          accessible: false,
          count: 0,
          error: error.message,
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据库结构检查完成',
      tables: results,
      config: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        keyLength: supabaseKey?.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('数据库结构检查异常:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
