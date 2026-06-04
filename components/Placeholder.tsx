import Link from 'next/link';
import { Empty } from '@/components/ui/Empty';
import type { IconName } from '@/components/ui/Icon';

interface PlaceholderProps {
  title: string;
  /** Empty-state icon. */
  icon?: IconName;
  /** Headline shown in the empty state. */
  heading: string;
  /** Supporting copy, e.g. which sprint delivers this screen. */
  sub: string;
}

/**
 * Sprint 0 route placeholder. Renders inside the shop shell so navigation, the
 * chrome, and the design tokens are all exercised on every route.
 */
export function Placeholder({ title, icon = 'leaf', heading, sub }: PlaceholderProps) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <Empty icon={icon} title={heading} sub={sub}>
        <Link className="btn btn-primary btn-md" href="/">
          Back to home
        </Link>
      </Empty>
    </div>
  );
}
