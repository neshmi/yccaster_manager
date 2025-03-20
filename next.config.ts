import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // This enables reading from the filesystem in production/Docker
  serverExternalPackages: ['fs', 'path']
};

export default nextConfig;
