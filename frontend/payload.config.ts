import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
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
      connectionString: (() => {
        const uri = process.env.DATABASE_URI as string
        const sep = uri.includes('?') ? '&' : '?'
        return uri.includes('search_path') ? uri : `${uri}${sep}options=-c+search_path%3Dpublic`
      })(),
    },
    push: true,
  }),

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
