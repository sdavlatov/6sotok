import { getPayload } from 'payload';
import config from '@payload-config';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ ok: false }, { status: 400 });

    const payload = await getPayload({ config });
    const doc = await payload.findByID({ collection: 'listings', id });
    await payload.update({
      collection: 'listings',
      id,
      data: { views: ((doc as any).views ?? 0) + 1 },
      overrideAccess: true,
      // Инкремент счётчика просмотров не должен сбрасывать кеш объявлений:
      // иначе кеш умирал бы от каждого открытия карточки (см. hooks в Listings.ts).
      context: { skipCacheFlush: true },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
