import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
    resolveAlias: {
      '@payload-config': './payload.config.ts',
    },
  },
  async redirects() {
    return [
      // Слитые страницы
      { source: '/about', destination: '/contacts', permanent: false },
      { source: '/add-business', destination: '/add-listing', permanent: false },
    ]
  },
}

export default withPayload(nextConfig)
