/**
 * Catalogue data-access layer ("the API").
 *
 * Server Components and route handlers read the catalogue exclusively through
 * these async helpers — never by importing `lib/data.ts` directly. Today they
 * resolve from the in-memory mock; once the admin panel imports real data, these
 * functions will read Firestore instead and every caller keeps working
 * unchanged. The async signatures already model that future I/O boundary.
 */
import {
  CATEGORIES,
  PRODUCTS,
  bestsellers,
  byCat,
  catBySlug,
  deals,
  find,
  findBySlug,
} from './data';
import { WEEKLY_MARKET } from './market';
import type { Category, MarketDay, Product } from './types';

/** All categories in their curated display order. */
export async function getCategories(): Promise<Category[]> {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
}

/** A single category by slug, or `null` if it doesn't exist. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return catBySlug(slug) ?? null;
}

/** All in-stock-and-not products for a category id. */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return byCat(categoryId);
}

/** A single product by slug, or `null` if it doesn't exist. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return findBySlug(slug) ?? null;
}

/** A single product by id, or `null` if it doesn't exist. Used by checkout. */
export async function getProductById(id: string): Promise<Product | null> {
  return find(id) ?? null;
}

/**
 * Search products by name or category name.
 *
 * Tokenises the query and matches against each product's `searchTokens`
 * (mirroring a Firestore `array-contains-any`), with a substring fallback so
 * partial words still match. Returns `[]` for an empty query.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/[^a-z0-9]+/).filter(Boolean);
  return PRODUCTS.filter((p) => {
    const haystack = p.searchTokens;
    return words.every(
      (w) => haystack.some((t) => t.includes(w)) || p.name.toLowerCase().includes(w),
    );
  });
}

/** Curated home rail: best sellers. */
export async function getBestsellers(): Promise<Product[]> {
  return bestsellers;
}

/** Curated home rail: today's deals (products with an MRP). */
export async function getDeals(): Promise<Product[]> {
  return deals;
}

/** All product slugs — used by `generateStaticParams`. */
export async function getAllProductSlugs(): Promise<string[]> {
  return PRODUCTS.map((p) => p.slug);
}

/** All category slugs — used by `generateStaticParams`. */
export async function getAllCategorySlugs(): Promise<string[]> {
  return CATEGORIES.map((c) => c.slug);
}

/**
 * The travelling weekly market schedule (one stop per weekday).
 *
 * Ordered Monday → Sunday for display. Swaps to the admin-managed Firestore
 * collection later without changing callers.
 */
export async function getWeeklyMarket(): Promise<MarketDay[]> {
  return [...WEEKLY_MARKET].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
}
