'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

// 公開ページ(/s/...) と 主催者トークンページ(/host/...) は
// 外部の人が開くので、サイドバー等のアプリ chrome を出さず素で見せる。
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith('/s/') || pathname.startsWith('/host/');

  if (bare) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
