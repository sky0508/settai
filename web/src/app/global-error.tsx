'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center" style={{ minHeight: '100vh' }}>
          <h2 className="font-serif font-bold text-[20px]" style={{ color: '#14233f' }}>
            アプリケーションエラーが発生しました
          </h2>
          <p className="text-[14px]" style={{ color: '#8a93a4' }}>
            しばらくしてからもう一度お試しください。
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-[13px] text-white font-bold text-[14px] cursor-pointer"
            style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)' }}
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
