import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // standalone untuk Docker/Codespaces, undefined untuk Vercel
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
}

export default nextConfig
