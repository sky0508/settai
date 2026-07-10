'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FilterPanel } from '@/components/search/FilterPanel';
import { VenueCard } from '@/components/search/VenueCard';
import { searchVenues } from './actions';
import type { SearchInput, RankedVenue } from '@/lib/types';

const DEFAULT_SEARCH: SearchInput = {
  area: '',
  companyName: '',
  roles: [],
  purposes: [],
  genres: [],
  budgetMin: 0,
  budgetMax: 99999,
  privateRoom: false,
  quietRoom: false,
  partySize: 4,
  guestBase: '',
  beerExclude: { mode: 'keep', makers: [] },
};

type Props = {
  initialCompany?: string;
  initialRole?: string;
  initialPurpose?: string;
  initialNgFoods?: string[];
  initialGenres?: string[];
  initialBase?: string;
  initialGuestId?: string;
  allComps?: { id: string; name: string; slug: string }[];
  allGuests?: { id: string; name: string; title: string; companyId: string; ngFoods: string[]; preferences: string[]; origin: string | null }[];
};

export default function SearchClient({
  initialCompany = '',
  initialRole = '',
  initialPurpose = '',
  initialNgFoods = [],
  initialGenres = [],
  initialBase = '',
  initialGuestId = '',
  allComps = [],
  allGuests = [],
}: Props) {
  const [results, setResults] = useState<RankedVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (input: SearchInput) => {
    setLoading(true);
    try {
      const data = await searchVenues(input);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init: SearchInput = {
      ...DEFAULT_SEARCH,
      companyName: initialCompany,
      roles: initialRole ? [initialRole] : [],
      genres: initialGenres,
      ngFoods: initialNgFoods,
      guestBase: initialBase,
      guestId: initialGuestId,
    };
    setLoading(true);
    searchVenues(init).then((data) => {
      setResults(data);
      setSearched(true);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h1 className="font-serif text-2xl font-semibold text-navy m-0">お店を探す</h1>
        <Link
          href="/search/optimal"
          className="flex items-center gap-1 text-[12.5px] font-medium hover:text-gold transition-colors"
          style={{ color: '#8a93a4' }}
        >
          <span className="material-symbols-outlined text-[16px]">groups</span>
          参加者から最適な場所を探す
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        <div className="md:sticky md:top-6 md:self-start">
          <FilterPanel
            onSearch={handleSearch}
            loading={loading}
            initialCompany={initialCompany}
            initialRole={initialRole}
            initialPurpose={initialPurpose}
            initialNgFoods={initialNgFoods}
            initialGenres={initialGenres}
            initialBase={initialBase}
            initialGuestId={initialGuestId}
            allComps={allComps}
            allGuests={allGuests}

          />
        </div>

        <div>
          {!searched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-navy/40">
              <span className="material-symbols-outlined text-5xl mb-3">search</span>
              <p className="text-sm">条件を設定して検索してください</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-navy/40">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">最適な店舗を検索中...</p>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-navy/40 bg-white border border-[#eee6d8] rounded-2xl p-6 shadow-sm">
              <span className="material-symbols-outlined text-5xl mb-3 text-gold">sentiment_dissatisfied</span>
              <p className="text-sm font-semibold text-navy">該当する店舗が見つかりません</p>
              <p className="text-xs mt-1 mb-5">条件を少し緩和して再度お試しいただけます</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => {
                    handleSearch({
                      ...DEFAULT_SEARCH,
                      companyName: initialCompany,
                      roles: initialRole ? [initialRole] : [],
                      budgetMax: 99999,
                    });
                  }}
                  className="px-4 py-2 border border-gold text-gold-dark hover:bg-gold/5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  予算上限を無制限にする
                </button>
                <button
                  onClick={() => {
                    handleSearch({
                      ...DEFAULT_SEARCH,
                      companyName: initialCompany,
                      roles: initialRole ? [initialRole] : [],
                      area: '',
                    });
                  }}
                  className="px-4 py-2 border border-navy/20 text-navy/70 hover:bg-navy/5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  全エリアから探す
                </button>
              </div>
            </div>
          )}

          {searched && !loading && results.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-navy/60">{results.length}件の候補</p>
              {results.map((v, i) => (
                <VenueCard key={v.id} venue={v} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
