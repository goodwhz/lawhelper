import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // 测试连接
    const { data: categories, error: categoriesError } = await supabase
      .from('law_categories')
      .select('count')
      .limit(1)

    if (categoriesError) {
      console.error('Categories query error:', categoriesError)
      return NextResponse.json({
        success: false,
        error: categoriesError.message,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      }, { status: 500 })
    }

    const { data: documents, error: documentsError } = await supabase
      .from('law_documents')
      .select('count')
      .limit(1)

    if (documentsError) {
      console.error('Documents query error:', documentsError)
      return NextResponse.json({
        success: false,
        error: documentsError.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      data: {
        categoriesCount: categories,
        documentsCount: documents,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
