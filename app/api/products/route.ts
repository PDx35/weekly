import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/queries';

/** GET /api/products — returns the live product list from Firestore or fallback. */
export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}
