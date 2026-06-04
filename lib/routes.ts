/**
 * Route helpers that map the prototype's state-router targets to real Next.js
 * paths. The chrome components used to call `nav('product', { id })`; they now
 * call `routes.product(id)` and pass the result to `<Link>` / `router.push`.
 */
export const routes = {
  home: () => '/',
  browse: () => '/browse',
  category: (slug: string) => `/category/${slug}`,
  product: (slug: string) => `/product/${slug}`,
  search: (q: string) => `/search?q=${encodeURIComponent(q)}`,
  cart: () => '/cart',
  checkout: () => '/checkout',
  confirm: (orderId: string) => `/confirm/${orderId}`,
  orders: () => '/orders',
  account: () => '/account',
  addresses: () => '/addresses',
  support: () => '/support',
  auth: () => '/auth',
} as const;
