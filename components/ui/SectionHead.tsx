'use client';

import { Icon } from './Icon';

interface SectionHeadProps {
  title: string;
  /** Optional subtitle under the title. */
  sub?: string;
  /** Optional action label, e.g. "See all". */
  action?: string;
  /** Click handler for the action button. */
  onAction?: () => void;
}

/** Section header with a title, optional subtitle, and an optional action link. */
export function SectionHead({ title, sub, action, onAction }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && (
        <button className="sec-action" onClick={onAction}>
          {action} <Icon name="arrowR" size={16} />
        </button>
      )}
    </div>
  );
}
