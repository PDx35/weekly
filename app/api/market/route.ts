/**
 * Weekly market API — exposes the admin-managed schedule to client components
 * (serviceability banner, checkout gate) that can't call the server `queries`
 * layer directly.
 */
import { NextResponse } from 'next/server';
import { getWeeklyMarket } from '@/lib/queries';

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(await getWeeklyMarket());
}
