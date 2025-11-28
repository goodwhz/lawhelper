import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 需要保护的路由
const protectedRoutes = [
  '/ai-chat',
  '/tools', 
  '/documents',
  '/knowledge-base',
  '/profile',
  '/admin'
]

// 公开路由（不需要认证）
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查是否是保护的路由
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  // 简化处理：让客户端组件处理认证检查
  // 不在服务器端做重定向，避免chunk加载问题
  
  // 对于公开路由，直接允许访问
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}