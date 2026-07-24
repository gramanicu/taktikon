import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @taktikon/ui ships raw .tsx source; Next must transpile it.
  // @taktikon/contracts is prebuilt ESM (dist) and must NOT be listed.
  transpilePackages: ['@taktikon/ui'],
  typedRoutes: true,
}

export default nextConfig
