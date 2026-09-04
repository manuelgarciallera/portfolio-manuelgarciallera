import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const isolatedBuildDir = process.env.PORTFOLIO_BUILD_DIR

if (
  isolatedBuildDir &&
  !/^owner-platform\/[.]data\/verification-artifacts\/[a-z0-9][a-z0-9-]*$/.test(isolatedBuildDir)
) {
  throw new Error('PORTFOLIO_BUILD_DIR must name a dedicated owner-platform verification artifact directory')
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' https: data:",
  "img-src 'self' https: data: blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https:",
  "connect-src 'self' https:",
  "frame-ancestors 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders: Array<{ key: string; value: string }> = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

if (isProd) {
  securityHeaders.push(
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
  )
}

const nextConfig: NextConfig = {
  ...(isolatedBuildDir ? { distDir: isolatedBuildDir } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  images: {
    qualities: [75, 92],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
