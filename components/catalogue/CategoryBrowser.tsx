'use client';

import React, { useState, useMemo } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Icon } from '@/components/ui/Icon';
import type { Category, Product } from '@/lib/types';

interface Section {
  category: Category;
  products: Product[];
}

interface CategoryBrowserProps {
  initialSections: Section[];
}

type SortKey = 'pop' | 'lo' | 'hi' | 'rate';

export function CategoryBrowser({ initialSections }: CategoryBrowserProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sort, setSort] = useState<SortKey>('pop');
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  if (!initialSections || initialSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <span className="text-4xl">🛒</span>
        <p className="mt-4 font-semibold">No categories or products available.</p>
      </div>
    );
  }

  const selectedSection = initialSections[activeIndex];

  const filteredProducts = useMemo(() => {
    if (!selectedSection) return [];
    let list = [...selectedSection.products];

    // Filter by Deals (Offer)
    if (onlyDeals) {
      list = list.filter((p) => p.mrp !== null);
    }

    // Filter by Stock
    if (onlyInStock) {
      list = list.filter((p) => p.stock);
    }

    // Filter by Max Price
    if (maxPrice !== null) {
      list = list.filter((p) => p.price <= maxPrice);
    }

    // Sort products
    if (sort === 'lo') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'hi') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'rate') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: 'pop' (Popularity - sorted by reviews count)
      list.sort((a, b) => b.reviews - a.reviews);
    }

    return list;
  }, [selectedSection, sort, onlyDeals, onlyInStock, maxPrice]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Premium split view layout */
        .split-browser {
          display: flex;
          height: 100vh;
          overflow: hidden;
          border-top: 1px solid #f1f5f9;
        }

        @media (min-width: 768px) {
          .split-browser {
            height: 100vh;
          }
        }

        /* Hide scrollbars but keep scroll capability */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Sidebar item style overrides */
        .sidebar-btn {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0px 16px 0px;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border-bottom: 1px solid rgba(241, 245, 249, 0.6);
          border-left: 4px solid transparent;
        }

        .sidebar-btn.active {
          background: #0596691a;
          font-weight: 700;
          color: #047857; /* text-emerald-700 */
          border-left-color: #059669; /* border-emerald-600 */
        }

        .sidebar-img-container {
          width: 48px;
          height: 48px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: all 0.2s ease;
        }

        .sidebar-btn.active .sidebar-img-container {
          background: #e6f4ea; /* light emerald tint */
          transform: scale(1.05);
        }

        /* Responsive spacing for product grid inside split browser */
        .split-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        @media (min-width: 640px) {
          .split-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (min-width: 1024px) {
          .split-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
          }
        }

        @media (min-width: 1280px) {
          .split-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 24px;
          }
        }
      `}} />

      <div className="split-browser pt-6 -4">
        {/* Left Side: Scrollable Categories Sidebar */}
        <aside className="w-[90px] flex-shrink-0 overflow-y-auto no-scrollbar bg-white border-r border-[#e2e8f0] !rounded-r-xl">
          {initialSections.map(({ category }, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={category.id}
                onClick={() => setActiveIndex(index)}
                className={`sidebar-btn ${active ? 'active' : ''}`}
              >
                <div className="sidebar-img-container">
                  {category.iconUrl ? (
                    <img
                      src={category.iconUrl}
                      alt={category.name}
                      loading="lazy"
                      className="w-10 h-10 object-contain transition-transform duration-200"
                    />
                  ) : (
                    <span className="text-xl">📦</span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight tracking-tight break-words max-w-[80px]">
                  {category.name}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Right Side: Scrollable Products Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
          <div className="mb-5 pb-3 border-b border-zinc-100">
            <h2 className="text-lg md:text-xl font-black text-zinc-900 leading-none">
              {selectedSection.category.name}
            </h2>
            {selectedSection.category.blurb && (
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {selectedSection.category.blurb}
              </p>
            )}
          </div>

          {selectedSection.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <span className="text-3xl">🥦</span>
              <p className="mt-2 text-xs font-semibold">No products found in this category.</p>
            </div>
          ) : (
            <>
              {/* Filters Bar: Stays in one line always, horizontally scrollable on mobile */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3.5 mb-4 border-b border-zinc-100 -mx-4 px-4 sm:-mx-6 sm:px-6">
                {/* Sort Dropdown */}
                <div className="relative flex items-center gap-1.5 h-8 pl-2.5 pr-6 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[13px] font-semibold text-zinc-700 cursor-pointer flex-shrink-0 transition-colors">
                  <Icon name="filter" size={13} className="text-zinc-500" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="appearance-none bg-transparent border-none outline-none cursor-pointer font-semibold text-zinc-700 text-sm pr-1"
                  >
                    <option value="pop">Popularity</option>
                    <option value="lo">Price: Low to High</option>
                    <option value="hi">Price: High to Low</option>
                    <option value="rate">Top Rated</option>
                  </select>
                  <Icon name="chevD" size={10} className="absolute right-2 pointer-events-none text-zinc-500" />
                </div>

                {/* Price Dropdown */}
                <div className="relative flex items-center gap-1.5 h-8 pl-2.5 pr-6 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[13px] font-semibold text-zinc-700 cursor-pointer flex-shrink-0 transition-colors">
                  <span className="text-zinc-500 font-bold">₹</span>
                  <select
                    value={maxPrice === null ? 'all' : maxPrice.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaxPrice(val === 'all' ? null : Number(val));
                    }}
                    className="appearance-none bg-transparent border-none outline-none cursor-pointer font-semibold text-zinc-700 text-[13px] pr-1"
                  >
                    <option value="all">All Prices</option>
                    <option value="50">Under ₹50</option>
                    <option value="100">Under ₹100</option>
                    <option value="200">Under ₹200</option>
                    <option value="500">Under ₹500</option>
                  </select>
                  <Icon name="chevD" size={10} className="absolute right-2 pointer-events-none text-zinc-500" />
                </div>

                {/* Offers Toggle */}
                <button
                  onClick={() => setOnlyDeals(!onlyDeals)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold flex-shrink-0 cursor-pointer transition-all ${
                    onlyDeals
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Icon name="tag" size={13} className={onlyDeals ? 'text-emerald-600' : 'text-zinc-500'} />
                  <span>Offers</span>
                </button>

                {/* In Stock Toggle */}
                <button
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold flex-shrink-0 cursor-pointer transition-all ${
                    onlyInStock
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span className={`flex h-1.5 w-1.5 rounded-full ${onlyInStock ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  <span>In Stock</span>
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <span className="text-3xl">🥦</span>
                  <p className="mt-2 text-xs font-semibold">No products match the selected filters.</p>
                </div>
              ) : (
                <div className="split-grid">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      className={filteredProducts.length === 1 ? 'max-w-[220px]' : ''}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
