import { Fragment } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';

export interface Crumb {
  label: string;
  /** Link target; the last (current) crumb usually omits this. */
  href?: string;
}

/** Breadcrumb trail. Linked crumbs use `next/link`; the final crumb is plain. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs pb-2">
      {items.map((it, i) => (
        <Fragment key={i}>
          {i > 0 && <Icon name="chevR" size={13} />}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
