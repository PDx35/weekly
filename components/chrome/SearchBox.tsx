'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { Price } from '@/components/ui/Price';
import { PRODUCTS, catName } from '@/lib/data';
import { routes } from '@/lib/routes';

/** Search input with live product suggestions and a "see all" action. */
export function SearchBox({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results =
    q.trim().length > 0
      ? PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            catName(p.cat).toLowerCase().includes(q.toLowerCase()),
        ).slice(0, 6)
      : [];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = () => {
    if (!q.trim()) return;
    router.push(routes.search(q));
    setOpen(false);
  };

  return (
    <div className={`search ${compact ? 'search-compact' : ''}`} ref={wrapRef}>
      <Icon name="search" size={18} className="search-ico" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder='Search "milk", "mango", "atta"…'
      />
      {q && (
        <button className="search-clear" onClick={() => setQ('')}>
          <Icon name="x" size={15} />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="search-pop">
          {results.map((p) => (
            <button
              key={p.id}
              className="search-item"
              onClick={() => {
                router.push(routes.product(p.id));
                setOpen(false);
              }}
            >
              <Img product={p} className="search-thumb" radius="8px" />
              <span className="search-meta">
                <b>{p.name}</b>
                <span>
                  {catName(p.cat)} · {p.unit}
                </span>
              </span>
              <Price value={p.price} size="sm" />
            </button>
          ))}
          <button className="search-all" onClick={submit}>
            See all results for “{q}” <Icon name="arrowR" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
