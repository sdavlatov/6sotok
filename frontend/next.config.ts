import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Медиа объявлений: локально — относительные /api/media/file/... (их next/image
    // разрешает сам), в проде — Vercel Blob. Unsplash встречается в демо-данных.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // ширины под реальные слоты карточек (96/120px превью, 16:9 карточки, галерея)
    imageSizes: [96, 128, 256, 384],
    deviceSizes: [640, 828, 1080, 1200, 1920],
  },
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
