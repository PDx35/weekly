import Link from 'next/link';
import { Icon } from './Icon';

interface SectionHeadProps {
  title: string;
  /** Optional subtitle under the title. */
  sub?: string;
  /** Optional action label, e.g. "See all". */
  action?: string;
  /** Where the action link points (preferred in Server Components). */
  actionHref?: string;
}

/**
 * Section header with a title, optional subtitle, and an optional action link.
 * The action is a `next/link`, so this stays a Server Component.
 */
export function SectionHead({ title, sub, action, actionHref }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && actionHref && (
        <Link className="sec-action" href={actionHref}>
          {action} <Icon name="arrowR" size={16} />
        </Link>
      )}
    </div>
  );
}
