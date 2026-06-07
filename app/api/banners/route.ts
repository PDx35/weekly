import { NextResponse } from 'next/server';
import { getBanners } from '@/lib/queries';
import { db } from '@/lib/firebase/client';
import { doc, updateDoc, increment } from 'firebase/firestore';

/** GET /api/banners — returns active banners. */
export async function GET() {
  const banners = await getBanners();
  return NextResponse.json(banners);
}

/** POST /api/banners — records impressions or clicks. */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bannerId = searchParams.get('id');
    const action = searchParams.get('action'); // 'view' | 'click'

    if (!bannerId || !action || !['view', 'click'].includes(action)) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const ref = doc(db, 'banners', bannerId);
    if (action === 'view') {
      await updateDoc(ref, { views: increment(1) });
    } else {
      await updateDoc(ref, { clicks: increment(1) });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to update banner analytics:', err);
    return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 });
  }
}
