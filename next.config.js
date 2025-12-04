/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本配置
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 确保环境变量在客户端和服务端都可用
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig