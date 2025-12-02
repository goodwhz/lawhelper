import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    dify_url: process.env.NEXT_PUBLIC_API_URL || 'default',
    dify_key: process.env.NEXT_PUBLIC_APP_KEY ? 'configured' : 'missing',
    all_vars: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_API_URL: !!process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_KEY: !!process.env.NEXT_PUBLIC_APP_KEY,
    },
  })
}
