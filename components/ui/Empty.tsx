import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyProps {
  icon?: IconName;
  title: string;
  /** Optional supporting copy. */
  sub?: string;
  /** Optional call-to-action content (e.g. a button). */
  children?: ReactNode;
}

/** Empty-state block with an icon, title, optional subtitle, and CTA slot. */
export function Empty({ icon = 'cart', title, sub, children }: EmptyProps) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={30} />
      </div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {children}
    </div>
  );
}
