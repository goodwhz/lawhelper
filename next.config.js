/** @type {import('next').NextConfig} */
const nextConfig = {
  // 解决多个package-lock.json冲突问题
  outputFileTracingRoot: process.cwd(),
  
  // 增加内存限制
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common');
    }
    return config;
  },
  
  // 基本配置，暂时禁用实验性功能
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 确保环境变量在客户端和服务端都可用
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // 优化构建已移除 swcMinify 配置（Next.js 15+ 已内置）
  
  // 外部包配置 (Next.js 15+)
  serverExternalPackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig