/**
 * Bulk CSV import for products.
 *
 * Expects a multipart/form-data POST with a `file` field (the CSV). The caller
 * must be a signed-in admin (Bearer token verified against the /admins
 * collection). Each CSV row becomes one Firestore `products` document.
 *
 * Returns `{ created: number, errors: string[] }`.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, isAdminConfigured } from '@/lib/firebase/admin';

/* ------------------------------------------------------------------ */
/*  CSV parsing (lightweight, no external lib)                        */
/* ------------------------------------------------------------------ */

/** Split a single CSV line respecting quoted fields (handles commas inside quotes). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/** Parse raw CSV text into an array of header-keyed objects. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? '';
    });
    return row;
  });
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                     */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  // ---- Admin SDK gate ----
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin is not configured.' },
      { status: 503 },
    );
  }

  // ---- Auth: verify Bearer token ----
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  // ---- Admin check ----
  const adminDb = getAdminDb();
  const adminSnap = await adminDb.collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    return NextResponse.json({ error: 'Forbidden — not an admin.' }, { status: 403 });
  }

  // ---- Read the CSV file from the multipart body ----
  let csvText: string;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No CSV file attached.' }, { status: 400 });
    }
    csvText = await (file as Blob).text();
  } catch {
    return NextResponse.json({ error: 'Could not read uploaded file.' }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or has no data rows.' }, { status: 400 });
  }

  // ---- Validate & write each row ----
  const errors: string[] = [];
  let created = 0;
  const batch = adminDb.batch();
  const productsRef = adminDb.collection('products');

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexed

    const name = r['name'] ?? '';
    const category = r['category'] ?? '';
    if (!name || !category) {
      errors.push(`Row ${rowNum}: name and category are required — skipped.`);
      continue;
    }

    const price = Number(r['price']) || 0;
    const discountPrice = Number(r['discount_price'] || r['discountprice']) || 0;
    const stock = Number(r['stock']) || 0;
    const weight = Number(r['weight']) || 0;
    const pieces = Number(r['pieces']) || 1;
    const isAvailableRaw = (r['is_available'] || r['isavailable'] || 'true').toLowerCase();
    const isAvailable = isAvailableRaw !== 'false' && isAvailableRaw !== '0' && isAvailableRaw !== 'no';
    const imageUrls = (r['image_urls'] || r['imageurls'] || '')
      .split('|')
      .map((u: string) => u.trim())
      .filter(Boolean);

    const doc = {
      name,
      category,
      description: r['description'] ?? '',
      price,
      discountPrice,
      unit: r['unit'] ?? '',
      stock,
      isAvailable,
      imageUrls,
      weight,
      pieces,
    };

    const ref = productsRef.doc(); // auto-id
    batch.set(ref, doc);
    created++;
  }

  if (created === 0) {
    return NextResponse.json(
      { error: 'No valid rows to import.', errors },
      { status: 400 },
    );
  }

  try {
    await batch.commit();
  } catch (e) {
    return NextResponse.json(
      { error: `Firestore batch write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ created, errors });
}
