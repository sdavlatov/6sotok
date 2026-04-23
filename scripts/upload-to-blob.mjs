import { put } from '/home/sdavlatov/projects/6sotok/frontend/node_modules/@vercel/blob/dist/index.js'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const UPLOADS_DIR = new URL('../frontend/public/uploads', import.meta.url).pathname

const mime = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.mov': 'video/quicktime', '.webm': 'video/webm',
}

const files = readdirSync(UPLOADS_DIR)

for (const filename of files) {
  const ext = extname(filename).toLowerCase()
  const contentType = mime[ext] ?? 'application/octet-stream'
  const filePath = join(UPLOADS_DIR, filename)
  const data = readFileSync(filePath)

  process.stdout.write(`Uploading ${filename}... `)
  const result = await put(filename, data, { access: 'public', token: TOKEN, contentType })
  console.log(`OK → ${result.url}`)
}

console.log('\nDone! Now update DB with new URLs.')
