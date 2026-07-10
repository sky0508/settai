'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 店舗写真のカルーセル。
 * - インライン: 横スワイプ（scroll-snap）＋矢印＋ドット。画像クリックでライトボックス。
 * - ライトボックス: 画面中央に拡大表示。スワイプ／矢印で送り、背景クリック・×・Escで閉じる。
 */
export default function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const c = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: c * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <>
      <div className="relative select-none">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-xl bg-navy/10 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${name} ${i + 1}枚目`}
              draggable={false}
              onClick={() => setLightbox(i)}
              className="w-full h-52 object-cover shrink-0 snap-center cursor-zoom-in"
            />
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <button type="button" aria-label="前の写真" onClick={() => go(idx - 1)} disabled={idx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 shadow flex items-center justify-center transition-opacity disabled:opacity-0 hover:bg-white">
              <span className="material-symbols-outlined text-[20px] text-navy">chevron_left</span>
            </button>
            <button type="button" aria-label="次の写真" onClick={() => go(idx + 1)} disabled={idx === photos.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 shadow flex items-center justify-center transition-opacity disabled:opacity-0 hover:bg-white">
              <span className="material-symbols-outlined text-[20px] text-navy">chevron_right</span>
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox photos={photos} name={name} startIdx={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

function Lightbox({
  photos,
  name,
  startIdx,
  onClose,
}: {
  photos: string[];
  name: string;
  startIdx: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = startIdx * el.clientWidth; // 開いた枚目へ即ジャンプ
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [startIdx, onClose]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const c = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: c * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center select-none" onClick={onClose}>
      <button type="button" aria-label="閉じる" onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
        <span className="material-symbols-outlined">close</span>
      </button>

      <div
        ref={ref}
        onScroll={onScroll}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((url, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center p-4 md:p-10">
            <img src={url} alt={`${name} ${i + 1}枚目`} draggable={false} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button type="button" aria-label="前の写真" onClick={(e) => { e.stopPropagation(); go(idx - 1); }} disabled={idx === 0}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-opacity disabled:opacity-0">
            <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          </button>
          <button type="button" aria-label="次の写真" onClick={(e) => { e.stopPropagation(); go(idx + 1); }} disabled={idx === photos.length - 1}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-opacity disabled:opacity-0">
            <span className="material-symbols-outlined text-[26px]">chevron_right</span>
          </button>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            {photos.map((_, i) => (
              <button key={i} type="button" aria-label={`${i + 1}枚目へ`} onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
