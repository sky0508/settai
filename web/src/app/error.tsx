'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center" style={{ minHeight: '60vh' }}>
      <span className="material-symbols-outlined text-[48px]" style={{ color: '#c2a15a' }}>error</span>
      <h2 className="font-serif font-bold text-[20px]" style={{ color: '#14233f' }}>
        問題が発生しました
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
  );
}
