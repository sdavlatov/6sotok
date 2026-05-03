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
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
