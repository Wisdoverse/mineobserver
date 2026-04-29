import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // 指定 workspace root，修复 Turbopack 警告
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 输出文件追踪根目录
  // outputFileTracingRoot: path.resolve(__dirname),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
