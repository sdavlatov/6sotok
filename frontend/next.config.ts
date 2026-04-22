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
}

export default withPayload(nextConfig)
