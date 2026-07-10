import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Лёгкая статистика для бренд-панели авторизации.
export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [total, verified] = await Promise.all([
      payload.count({
        collection: 'listings',
        where: { status: { equals: 'published' } },
      }),
      payload.count({
        collection: 'listings',
        where: {
          status: { equals: 'published' },
          hasStateAct: { equals: true },
        },
      }),
    ])

    return NextResponse.json({ total: total.totalDocs, verified: verified.totalDocs })
  } catch {
    return NextResponse.json({ total: 0, verified: 0 })
  }
}
