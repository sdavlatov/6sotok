import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const p = await getPayload({ config })
    const result = await p.find({ collection: 'listings', limit: 5 })
    return Response.json({ ok: true, count: result.totalDocs, docs: result.docs.map((d: any) => ({ id: d.id, title: d.title, status: d.status })) })
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e), message: e?.message, stack: e?.stack?.slice(0, 500) })
  }
}
