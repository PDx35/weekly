import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Your account' };

export default function AccountPage() {
  return (
    <Placeholder
      title="Account"
      icon="user"
      heading="Your account dashboard is coming"
      sub="Profile, saved details, and quick links arrive in Sprint 2."
    />
  );
}
