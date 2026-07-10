'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Suggestion = { placeId: string; text: string };

export type PlaceDetail = {
  name: string;
  address: string;
  phone?: string;
};

type Props = {
  onSelect: (detail: PlaceDetail) => void;
};

export default function PlaceAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  const search = useCallback(async (q: string) => {
    if (!apiKey || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input: q,
          languageCode: 'ja',
          includedPrimaryTypes: ['restaurant', 'food', 'bar'],
          locationBias: {
            circle: {
              center: { latitude: 35.6811, longitude: 139.7670 },
              radius: 80000.0,
            },
          },
        }),
      });
      const data = await res.json();
      const sug: Suggestion[] = (data.suggestions ?? []).map((s: Record<string, unknown>) => {
        const pred = s.placePrediction as Record<string, unknown>;
        const textObj = pred.text as Record<string, unknown>;
        return { placeId: pred.placeId as string, text: textObj.text as string };
      });
      setSuggestions(sug);
      setOpen(sug.length > 0);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = async (sug: Suggestion) => {
    setOpen(false);
    setQuery(sug.text);
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${sug.placeId}?languageCode=ja`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber',
          },
        },
      );
      const place = await res.json();
      onSelect({
        name: (place.displayName as { text: string } | undefined)?.text ?? sug.text,
        address: (place.formattedAddress as string) ?? '',
        phone: (place.nationalPhoneNumber as string | undefined),
      });
    } catch {
      onSelect({ name: sug.text, address: '' });
    }
  };

  // クリックアウトで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!apiKey) return null;

  return (
    <div ref={containerRef} className="relative mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[18px]" style={{ color: '#c2a15a' }}>auto_awesome</span>
        <span className="text-[13px] font-bold" style={{ color: '#3a4661' }}>店名で検索して自動入力</span>
        <span className="text-[11.5px] px-2 py-0.5 rounded-full" style={{ background: '#fdfaf2', color: '#8a6a1f', border: '1px solid #e0d5b3' }}>Google Places</span>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px]" style={{ color: '#c2a15a' }}>search</span>
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] animate-spin" style={{ color: '#c2a15a', animationDuration: '0.8s' }}>progress_activity</span>
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="例：日本料理 ゆかり 東京..."
          className="w-full rounded-xl pl-10 pr-10 py-3 text-[14px] outline-none"
          style={{ border: '1.5px solid #c2a15a', background: '#fdfaf2', color: '#3a4661' }}
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl shadow-lg overflow-hidden" style={{ background: '#fff', border: '1px solid #eee6d8' }}>
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-[13.5px] hover:bg-[#fdfaf2] transition-colors flex items-center gap-2.5"
              style={{ color: '#3a4661', borderBottom: '1px solid #f5f1e8' }}
            >
              <span className="material-symbols-outlined text-[16px] shrink-0" style={{ color: '#c2a15a' }}>restaurant</span>
              {s.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
