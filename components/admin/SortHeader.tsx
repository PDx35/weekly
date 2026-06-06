'use client';

import { useCallback, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Generic sort hook                                                 */
/* ------------------------------------------------------------------ */

export type SortDir = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/**
 * Reusable sort hook for admin tables.
 *
 * Pass the raw array and a record mapping sort-key → accessor function.
 * Returns sorted data + toggle callback.
 */
export function useSort<T, K extends string>(
  data: T[],
  accessors: Record<K, (item: T) => string | number | boolean>,
  defaultKey: K,
  defaultDir: SortDir = 'asc',
) {
  const [sort, setSort] = useState<SortState<K>>({ key: defaultKey, dir: defaultDir });

  const toggle = useCallback((key: K) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  }, []);

  const sorted = useMemo(() => {
    const fn = accessors[sort.key];
    if (!fn) return data;
    return [...data].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      let cmp = 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb);
      } else if (typeof va === 'boolean' && typeof vb === 'boolean') {
        cmp = Number(va) - Number(vb);
      } else {
        cmp = Number(va) - Number(vb);
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, accessors]);

  return { sorted, sort, toggle };
}

/* ------------------------------------------------------------------ */
/*  Sortable <th> component                                           */
/* ------------------------------------------------------------------ */

interface SortThProps {
  label: string;
  sortKey: string;
  current: SortState<string>;
  // Method syntax → bivariant params, so a narrower `(key: K) => void` toggle
  // from useSort is accepted without an `any`.
  onToggle(key: string): void;
  className?: string;
}

/** A clickable table header cell with sort indicators. */
export function SortTh({ label, sortKey, current, onToggle, className = '' }: SortThProps) {
  const active = current.key === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-4 py-2.5 hover:text-neutral-800 ${className}`}
      onClick={() => onToggle(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px] leading-none">
          {active ? (current.dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter bar wrapper                                                */
/* ------------------------------------------------------------------ */

/** Simple flex wrapper for filter controls above a table. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}
