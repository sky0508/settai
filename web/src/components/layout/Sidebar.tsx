'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { key: 'search',    icon: 'search',        label: 'お店を探す',    href: '/search' },
  { key: 'schedule',  icon: 'edit_calendar', label: '会食を作る',    href: '/schedules' },
  { key: 'map',       icon: 'map',        label: '地図で見る',    href: '/map' },
  { key: 'guest',     icon: 'group',      label: 'ゲスト管理',    href: '/guests' },
  { key: 'favorite',  icon: 'favorite',   label: 'お気に入り',    href: '/favorites' },
  { key: 'dashboard', icon: 'monitoring', label: 'ダッシュボード', href: '/dashboard' },
  { key: 'settings',  icon: 'settings',   label: '設定',          href: '/settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-[246px] min-h-screen shrink-0"
      style={{ background: 'linear-gradient(180deg,#1b2c49,#101c30)' }}
    >
      {/* ロゴ */}
      <div className="px-6 py-7 flex items-center gap-3">
        {/* 六角形バッジ */}
        <div
          className="w-[42px] h-[46px] shrink-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(150deg,#e6c987,#b98f3f)',
            clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)',
          }}
        >
          {/* 箸＋箸置き（アプリアイコン=継承ヘックスと同図） */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <g stroke="#17253f" strokeWidth="2.3" strokeLinecap="round">
              <line x1="8" y1="15.5" x2="15.5" y2="8" />
              <line x1="10" y1="17.5" x2="17.5" y2="10" />
            </g>
            <rect x="4" y="15.6" width="7" height="2.4" rx="1.2" fill="#17253f" transform="rotate(-46 7.5 16.8)" />
          </svg>
        </div>
        <span
          className="font-serif font-bold text-[25px] tracking-wide"
          style={{ color: '#f0e4cb' }}
        >
          会食ナビ
        </span>
      </div>

      {/* ナビ項目 */}
      <nav className="flex-1 px-3.5 pb-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
              style={{
                color: active ? '#f0d9a0' : '#c4ccdb',
                background: active ? 'rgba(226,201,135,0.12)' : 'transparent',
              }}
            >
              {/* 左バー */}
              <span
                className="absolute left-0.5 top-2 bottom-2 w-0.5 rounded-full transition-all"
                style={{ background: active ? '#d8b46a' : 'transparent' }}
              />
              <span
                className="material-symbols-outlined text-[22px] transition-colors"
                style={{
                  color: active ? '#d8b46a' : '#93a0b8',
                  fontVariationSettings: `'FILL' ${active ? 1 : 0}`,
                }}
              >
                {item.icon}
              </span>
              <span className="text-[15px]" style={{ fontWeight: active ? 700 : 500 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ユーザー行 */}
      <div
        className="px-[22px] py-4 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#26385a' }}
        >
          <span className="material-symbols-outlined text-[21px]" style={{ color: '#c9d2e2' }}>
            person
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium truncate" style={{ color: '#eef2f8' }}>
            田中 一郎
          </div>
          <div className="text-[11px] truncate" style={{ color: '#8492ac' }}>
            株式会社セッタイ
          </div>
        </div>
      </div>
    </aside>
  );
}
