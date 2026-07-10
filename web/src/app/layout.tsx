import type { Metadata } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '会食ナビ',
  description: '会食の店選びを、もっとスマートに',
};

// DB/認証に依存するページは build 時 prerender せず request 時にレンダリング
// （env ミスや DB 障害でビルドが落ちるのを防ぎ、ダッシュボード等を常に最新にする）
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${notoSerifJP.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
