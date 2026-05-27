import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Next.js 15+ 默认启用，保留空对象以防未来需要
  },
};

export default nextConfig;
