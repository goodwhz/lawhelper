/** @type {import('next').NextConfig} */
const path = require('path')

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

  // 配置 turbopack 明确指定项目根目录
  turbopack: {
    root: __dirname,
  },

  // 配置 webpack 以解析父目录的 node_modules
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
      'node_modules',
    ]
    config.externals = []
    return config
  },
}

module.exports = nextConfig


