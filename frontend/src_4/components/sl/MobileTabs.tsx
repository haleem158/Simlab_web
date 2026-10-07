'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';

const TABS = [
  { href: '/dashboard', icon: 'dash', label: 'Dashboard' },
  { href: '/token-supply', icon: 'coins', label: 'Token supply' },
  { href: '/vesting', icon: 'cal', label: 'Vesting' },
  { href: '/token-impact', icon: 'down', label: 'Price impact' },
];

/** Bottom navigation. Only visible at phone and tablet widths. */
export function MobileTabs() {
  const path = usePathname();
  return (
    <nav className="mtabs" aria-label="Main">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={`mt${path === t.href ? ' on' : ''}`} aria-current={path === t.href ? 'page' : undefined}>
          <Icon n={t.icon} style={{ width: 22, height: 22 }} />
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
