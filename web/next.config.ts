import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 向け: standalone 出力で Docker/Lambda 互換
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  experimental: {
    // Server Action の body 上限（既定 1MB）。店舗写真アップロード用に拡張
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
