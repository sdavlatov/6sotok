import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const REASONS = ['fraud', 'stale', 'wrong_info', 'duplicate', 'spam', 'other']

/**
 * Жалоба на объявление (модель модерации «авто + жалобы»). Публичный POST:
 * жаловаться может любой посетитель. Админ разбирает жалобы в /admin и при
 * необходимости снимает объявление (status → 'blocked').
 */
export async function POST(req: NextRequest) {
  try {
    const { listingId, reason, comment, contact } = await req.json()
    // id объявления в Postgres числовой — реляция Payload отвергает строку.
    const lid = Number(listingId)
    if (!Number.isInteger(lid) || lid <= 0 || !REASONS.includes(reason)) {
      return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
    }
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'reports',
      data: {
        listing: lid,
        reason,
        comment: typeof comment === 'string' ? comment.slice(0, 1000) : undefined,
        reporterContact: typeof contact === 'string' ? contact.slice(0, 200) : undefined,
        status: 'new',
      },
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[report] create failed:', e)
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
