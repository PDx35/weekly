/**
 * Catalogue data-access layer ("the API").
 *
 * Server Components and route handlers read the catalogue exclusively through
 * these helpers. They read the live Firestore `products`/`categories`/
 * `weeklyMarket` collections (web SDK, server-side) and map the store's schema
 * (see docs/current_db.md) into the storefront's `Product`/`Category` shapes.
 *
 * If a read fails (e.g. rules not yet opened for public catalogue reads), each
 * helper falls back to the bundled mock so the site still renders. NOTE: this
 * requires `products` and `categories` to be publicly readable in Firestore
 * rules — see firestore.rules.
 */
import { cache } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import {
  CATEGORIES as MOCK_CATEGORIES,
  PRODUCTS as MOCK_PRODUCTS,
  bestsellers as MOCK_BESTSELLERS,
  deals as MOCK_DEALS,
} from './data';
import { db } from './firebase/client';
import { WEEKLY_MARKET } from './market';
import type { Category, MarketDay, Product } from './types';

// Tints for category tiles (the DB has no colours), assigned by display order.
const TINTS: [string, string][] = [
  ['#FCEFD9', '#9A6B16'],
  ['#E7F3E4', '#3C7A36'],
  ['#F1F4FB', '#3F5A93'],
  ['#F8EEE2', '#9A6233'],
  ['#EAF1EE', '#2F7D5B'],
  ['#F5EFE3', '#8A6A2C'],
  ['#FBEDE9', '#A94B36'],
  ['#EEF1F2', '#566066'],
];

const tokenize = (...parts: string[]): string[] => [
  ...new Set(
    parts
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  ),
];

type Doc = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

function mapCategory(id: string, d: Doc, index: number): Category {
  const [tint, ink] = TINTS[index % TINTS.length];
  const order = num(d.sortOrder) || index;
  return {
    id,
    slug: id,
    name: str(d.name) || id,
    blurb: str(d.blurb),
    tint,
    ink,
    order,
    iconUrl: str(d.homeIconUrl) || str(d.browseIconUrl) || null,
  };
}

function mapProduct(id: string, d: Doc, catName: string): Product {
  const price = num(d.price);
  const discount = num(d.discountPrice);
  const onOffer = discount > 0 && discount < price;
  const name = str(d.name);
  const imageUrls = Array.isArray(d.imageUrls) ? (d.imageUrls.filter(Boolean) as string[]) : [];
  const images = imageUrls.length ? imageUrls : str(d.imageUrl) ? [str(d.imageUrl)] : [];
  return {
    id,
    slug: id,
    cat: str(d.category),
    name,
    price: onOffer ? discount : price,
    unit: str(d.unit),
    mrp: onOffer ? price : null,
    rating: num(d.rating),
    reviews: num(d.reviewCount),
    tag: null,
    desc: str(d.description) || null,
    stock: d.isAvailable !== false && num(d.stock) > 0,
    searchTokens: tokenize(name, catName),
    images,
  };
}

/** All categories from Firestore (cached per request); falls back to the mock. */
const getCategoriesRaw = cache(async (): Promise<Category[]> => {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const cats = snap.docs
      .filter((doc) => (doc.data() as Doc).active !== false)
      .map((doc, i) => mapCategory(doc.id, doc.data() as Doc, i))
      .sort((a, b) => a.order - b.order);
    return cats.length ? cats : MOCK_CATEGORIES;
  } catch {
    return MOCK_CATEGORIES;
  }
});

/** All products from Firestore (cached per request); falls back to the mock. */
const getProductsRaw = cache(async (): Promise<Product[]> => {
  try {
    const cats = await getCategoriesRaw();
    const catName = new Map(cats.map((c) => [c.id, c.name]));
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) return MOCK_PRODUCTS;
    return snap.docs.map((doc) => {
      const data = doc.data() as Doc;
      return mapProduct(doc.id, data, catName.get(str(data.category)) ?? '');
    });
  } catch {
    return MOCK_PRODUCTS;
  }
});

/** All categories in display order. */
export async function getCategories(): Promise<Category[]> {
  return getCategoriesRaw();
}

/** A single category by slug, or `null` if it doesn't exist. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategoriesRaw()).find((c) => c.slug === slug) ?? null;
}

/** All products for a category id. */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return (await getProductsRaw()).filter((p) => p.cat === categoryId);
}

/** A single product by slug (= doc id), or `null`. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getProductsRaw()).find((p) => p.slug === slug) ?? null;
}

/** A single product by id, or `null`. Used by checkout. */
export async function getProductById(id: string): Promise<Product | null> {
  return (await getProductsRaw()).find((p) => p.id === id) ?? null;
}

/**
 * Search products by name or category name. Tokenises the query and matches
 * against each product's `searchTokens`, with a substring fallback. `[]` for an
 * empty query.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/[^a-z0-9]+/).filter(Boolean);
  const products = await getProductsRaw();
  return products.filter((p) =>
    words.every(
      (w) => p.searchTokens.some((t) => t.includes(w)) || p.name.toLowerCase().includes(w),
    ),
  );
}

/** Home rail: best sellers (most-reviewed first). */
export async function getBestsellers(): Promise<Product[]> {
  const products = await getProductsRaw();
  if (products === MOCK_PRODUCTS) return MOCK_BESTSELLERS;
  return [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
}

/** Home rail: today's deals (products with a strike-through MRP). */
export async function getDeals(): Promise<Product[]> {
  const products = await getProductsRaw();
  if (products === MOCK_PRODUCTS) return MOCK_DEALS;
  return products.filter((p) => p.mrp).slice(0, 8);
}

/** All product slugs — used by `generateStaticParams`. */
export async function getAllProductSlugs(): Promise<string[]> {
  return (await getProductsRaw()).map((p) => p.slug);
}

/** All category slugs — used by `generateStaticParams`. */
export async function getAllCategorySlugs(): Promise<string[]> {
  return (await getCategoriesRaw()).map((c) => c.slug);
}

/**
 * The travelling weekly market schedule (admin-managed in Firestore), ordered
 * Monday → Sunday. Falls back to the bundled mock on error.
 */
export async function getWeeklyMarket(): Promise<MarketDay[]> {
  try {
    const snap = await getDocs(collection(db, 'weeklyMarket'));
    if (snap.empty) return sortMarket(WEEKLY_MARKET);
    const stops = snap.docs.map((doc) => {
      const d = doc.data() as Doc;
      // Prefer the multi-day `days` array; fall back to a legacy single `day`.
      const days = Array.isArray(d.days)
        ? (d.days as unknown[]).map((x) => Number(x)).filter((n) => Number.isFinite(n))
        : [num(d.day)];
      return {
        days,
        zip: str(d.zip),
        area: str(d.area),
        lng: num(d.lng),
        lat: num(d.lat),
        discountPercent: num(d.discountPercent),
      } satisfies MarketDay;
    });
    return sortMarket(stops);
  } catch {
    return sortMarket(WEEKLY_MARKET);
  }
}

const firstWeekday = (m: MarketDay): number =>
  m.days.length ? Math.min(...m.days.map((d) => ((d % 7) + 6) % 7)) : 7;

const sortMarket = (m: MarketDay[]): MarketDay[] =>
  [...m].sort((a, b) => firstWeekday(a) - firstWeekday(b));
