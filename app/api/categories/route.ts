import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/queries';

/** GET /api/categories — returns the live category list from Firestore. */
export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}
