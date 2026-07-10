'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { key: 'search',    icon: 'search',        label: '探す',      href: '/search' },
  { key: 'schedule',  icon: 'edit_calendar', label: '会食',      href: '/schedules' },
  { key: 'map',       icon: 'map',        label: '地図',      href: '/map' },
  { key: 'guest',     icon: 'group',      label: 'ゲスト',    href: '/guests' },
  { key: 'favorite',  icon: 'favorite',   label: 'お気に入り', href: '/favorites' },
  { key: 'dashboard', icon: 'monitoring', label: '実績',       href: '/dashboard' },
  { key: 'settings',  icon: 'settings',   label: '設定',       href: '/settings' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
      style={{
        background: '#fbf8f2',
        borderTop: '1px solid #e9e2d5',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 16px rgba(20,35,63,0.06)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex-1 flex flex-col items-center pt-2 pb-2.5 gap-1"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{
                color: active ? '#c2a15a' : '#9aa0ab',
                fontVariationSettings: `'FILL' ${active ? 1 : 0}`,
              }}
            >
              {item.icon}
            </span>
            <span
              className="text-[10px]"
              style={{ color: active ? '#c2a15a' : '#9aa0ab', fontWeight: active ? 700 : 400 }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
