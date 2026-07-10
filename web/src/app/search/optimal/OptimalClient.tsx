'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { findOptimalVenues } from './actions';
import type { RankedByTravel } from '@/lib/travel/types';

type CompanyOption = { id: string; name: string; nearestStation: string | null };

export default function OptimalClient({
  officeReady,
  allCompanies,
}: {
  officeReady: boolean;
  allCompanies: CompanyOption[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<RankedByTravel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runSearch = (ids: string[]) => {
    startTransition(async () => {
      const res = await findOptimalVenues(ids);
      if (!res.ok) {
        setError(
          res.reason === 'no_office'
            ? '自社拠点が未設定です。設定 > 自社拠点 で登録してください。'
            : '参加企業を1社以上追加してください。',
        );
        setResults(null);
        return;
      }
      setError(null);
      setResults(res.results);
    });
  };

  const addCompany = (id: string) => {
    if (!id || selectedIds.includes(id)) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    runSearch(next);
  };

  const removeCompany = (id: string) => {
    const next = selectedIds.filter((x) => x !== id);
    setSelectedIds(next);
    if (next.length > 0) {
      runSearch(next);
    } else {
      setResults(null);
      setError(null);
    }
  };

  if (!officeReady) {
    return (
      <div className="p-6 bg-white border border-[#eee6d8] rounded-2xl text-center">
        <p className="text-sm text-navy/70 mb-3">自社拠点が未設定です。移動コストの計算に必要です。</p>
        <Link
          href="/settings/office"
          className="inline-block px-4 py-2 rounded-xl text-white font-bold text-sm"
          style={{ background: '#14233f' }}
        >
          自社拠点を設定する
        </Link>
      </div>
    );
  }

  const selectedCompanies = allCompanies.filter((c) => selectedIds.includes(c.id));
  const availableCompanies = allCompanies.filter((c) => !selectedIds.includes(c.id));

  return (
    <div className="space-y-5">
      <div className="p-4 bg-white border border-[#eee6d8] rounded-2xl">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: '#14233f', color: '#fff' }}>
            自社
          </span>
          {selectedCompanies.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border"
              style={{ borderColor: '#dfe3ea', color: '#3a4661' }}
            >
              {c.name}
              {!c.nearestStation && <span className="text-xs" style={{ color: '#c0504b' }}>（拠点未登録）</span>}
              <button
                type="button"
                onClick={() => removeCompany(c.id)}
                className="material-symbols-outlined text-[16px] cursor-pointer"
                style={{ color: '#8a93a4' }}
                aria-label={`${c.name}を削除`}
              >
                close
              </button>
            </span>
          ))}
        </div>
        <select
          value=""
          onChange={(e) => addCompany(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy"
        >
          <option value="">+ 参加企業を追加...</option>
          {availableCompanies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isPending && <p className="text-sm text-navy/50">計算中...</p>}
      {error && <p className="text-sm" style={{ color: '#c0504b' }}>{error}</p>}

      {results && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={r.venueId} className="p-4 bg-white border border-[#eee6d8] rounded-2xl">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <Link href={`/venues/${r.venueId}`} className="font-serif font-bold text-lg text-navy hover:text-gold">
                  {i + 1}. {r.venueName}
                </Link>
                <span className="text-sm font-bold" style={{ color: '#c2a15a' }}>
                  平均 {Math.round(r.averageCost)}分相当
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.breakdown.map((b) => (
                  <span
                    key={b.label}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: '#f6f3ec', color: '#55617a' }}
                  >
                    {b.label} {b.minutes}分{b.transfers != null ? `・乗換${b.transfers}回` : '（概算）'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
