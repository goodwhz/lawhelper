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
}

module.exports = nextConfig