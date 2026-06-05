/**
 * Search API — backs the header SearchBox live suggestions.
 *
 * Client components can't call the server `queries` layer directly, so this
 * route exposes it over HTTP. `GET /api/search?q=milk&limit=6` → matching
 * products. When the catalogue moves to Firestore, only `searchProducts`
 * changes; this handler stays the same.
 */
import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 24) : 24;

  const results = await searchProducts(q);
  return NextResponse.json({ products: results.slice(0, limit) });
}
