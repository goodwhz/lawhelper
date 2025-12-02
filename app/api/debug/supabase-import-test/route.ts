import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

console.log('Testing Supabase import...')

let supabaseImportSuccess = false
let supabaseImportError: any = null

try {
  console.log('Supabase import successful')
  supabaseImportSuccess = true
} catch (error) {
  console.error('Supabase import failed:', error)
  supabaseImportError = error
}

export async function POST(_request: NextRequest) {
  if (supabaseImportSuccess) {
    return NextResponse.json({ message: 'Supabase import works' })
  } else {
    return NextResponse.json({
      error: 'Supabase import failed',
      details: supabaseImportError?.message || 'Unknown error',
    }, { status: 500 })
  }
}
