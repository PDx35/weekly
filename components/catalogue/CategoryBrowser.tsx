'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Category, Product } from '@/lib/types';

interface Section {
  category: Category;
  products: Product[];
}

interface CategoryBrowserProps {
  initialSections: Section[];
}

export function CategoryBrowser({ initialSections }: CategoryBrowserProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!initialSections || initialSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <span className="text-4xl">🛒</span>
        <p className="mt-4 font-semibold">No categories or products available.</p>
      </div>
    );
  }

  const selectedSection = initialSections[activeIndex];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Premium split view layout */
        .split-browser {
          display: flex;
          height: calc(100vh - 120px);
          overflow: hidden;
          background: #ffffff;
          margin-left: -20px;
          margin-right: -20px;
          margin-bottom: -40px;
          border-top: 1px solid #f1f5f9;
        }

        @media (min-width: 768px) {
          .split-browser {
            height: calc(100vh - 130px);
            margin-bottom: -60px;
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
          padding: 16px 8px;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border-bottom: 1px solid rgba(241, 245, 249, 0.6);
          background: #f8fafc;
          border-left: 4px solid transparent;
        }

        .sidebar-btn.active {
          background: #ffffff;
          font-weight: 700;
          color: #047857; /* text-emerald-700 */
          border-left-color: #059669; /* border-emerald-600 */
        }

        .sidebar-img-container {
          width: 48px;
          height: 48px;
          border-radius: 9999px;
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
          grid-template-cols: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding-bottom: 120px;
        }

        @media (min-width: 768px) {
          .split-grid {
            grid-template-cols: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }
        }
      `}} />

      <div className="split-browser">
        {/* Left Side: Scrollable Categories Sidebar */}
        <aside className="w-[85px] sm:w-[100px] md:w-[120px] flex-shrink-0 overflow-y-auto no-scrollbar bg-[#f8fafc] border-r border-[#e2e8f0]">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar bg-white">
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
            <div className="split-grid">
              {selectedSection.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
