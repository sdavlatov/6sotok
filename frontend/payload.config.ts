import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'

import { Listings } from './src/collections/Listings'
import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'

// process.cwd() надёжнее import.meta.url в webpack/Next.js контексте
const projectDir = process.cwd()

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

  collections: [Listings, Media, Users],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI as string,
    },
    push: true,
  }),

  plugins: [
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
  ],

  editor: lexicalEditor(),

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
