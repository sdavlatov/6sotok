import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import sharp from 'sharp'
import path from 'path'

import { Listings } from './src/collections/Listings'
import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'
import { Reports } from './src/collections/Reports'
import { resendAdapter } from './src/lib/email-resend'

// process.cwd() надёжнее import.meta.url в webpack/Next.js контексте
const projectDir = process.cwd()

// Email через Resend — только если задан ключ. Иначе Payload логирует письма в
// консоль (dev), а подтверждение email просто не блокирует (см. Users.ts).
const RESEND_KEY = process.env.RESEND_API_KEY
const email = RESEND_KEY
  ? resendAdapter({
      apiKey: RESEND_KEY,
      defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      defaultFromName: '6sotok',
    })
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: projectDir,
    },
  },

  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },

  collections: [Listings, Media, Users, Reports],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI as string,
    },
    // Локально всегда true. В prod — только если PAYLOAD_DB_PUSH=true (только для первого деплоя)
    push: process.env.NODE_ENV !== 'production' || process.env.PAYLOAD_DB_PUSH === 'true',
  }),

  plugins: [
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
  ],

  editor: lexicalEditor(),

  ...(email ? { email } : {}),

  // Без sharp Payload не выполняет ресайз, хотя в Media.ts заданы imageSizes:
  // в хранилище ложились только оригиналы (мегабайты на фото).
  sharp,

  secret: process.env.PAYLOAD_SECRET as string,

  typescript: {
    outputFile: path.resolve(projectDir, 'payload-types.ts'),
  },

  upload: {
    limits: {
      fileSize: 200_000_000,
    },
  },
})
