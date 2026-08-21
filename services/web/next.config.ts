import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Untuk Capacitor, ganti output ke 'export':
  // output: 'export',
  // trailingSlash: true,
  // images: { unoptimized: true },
}

export default nextConfig
