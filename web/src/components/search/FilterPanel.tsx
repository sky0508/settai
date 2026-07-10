'use client';

import { useState } from 'react';

import Combobox from '@/components/ui/Combobox';
import type { SearchInput } from '@/lib/types';

const AREAS = ['京橋', '日本橋', '銀座', '八重洲', '東銀座', '六本木', '赤坂', '四ツ谷', '那覇', '名護'];
const ROLES = ['役員・経営層', '部長', '課長'];
const PURPOSES = ['新規開拓', '関係強化', '謝罪', '御礼', '慰労'];
const GENRES = [
  { id: '日本料理', label: '日本料理', icon: 'set_meal' },
  { id: '寿司', label: '寿司', icon: 'rice_bowl' },
  { id: '鉄板焼き', label: '鉄板焼き', icon: 'outdoor_grill' },
  { id: 'フレンチ', label: 'フレンチ', icon: 'restaurant' },
  { id: '中華', label: '中華', icon: 'ramen_dining' },
  { id: 'イタリアン', label: 'イタリアン', icon: 'local_pizza' },
  { id: '焼肉', label: '焼肉', icon: 'kebab_dining' },
];
const BEER_MAKERS = [
  { key: 'kirin', label: 'キリン' },
  { key: 'asahi', label: 'アサヒ' },
  { key: 'suntory', label: 'サントリー' },
  { key: 'sapporo', label: 'サッポロ' },
];

type Props = {
  onSearch: (input: SearchInput) => void;
  loading: boolean;
  initialCompany?: string;
  initialRole?: string;
  initialPurpose?: string;
  initialNgFoods?: string[];
  initialGenres?: string[];
  initialBase?: string;
  initialGuestId?: string;
  initialPartySize?: number;
  allComps?: { id: string; name: string; slug: string }[];
  allGuests?: { id: string; name: string; title: string; companyId: string; ngFoods: string[]; preferences: string[]; origin: string | null }[];

};

function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${selected.includes(o)
            ? 'bg-navy text-white border-navy'
            : 'bg-white text-navy border-navy/30 hover:border-navy'
            }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function FilterPanel({
  onSearch,
  loading,
  initialCompany = '',
  initialRole = '',
  initialPurpose = '',
  initialNgFoods = [],
  initialGenres = [],
  initialBase = '',
  initialGuestId = '',
  initialPartySize,
  allComps = [],
  allGuests = [],

}: Props) {
  const [area, setArea] = useState('');
  const [companyName, setCompany] = useState(initialCompany);
  const [guestId, setGuestId] = useState(initialGuestId);
  const [roles, setRoles] = useState<string[]>(initialRole ? [initialRole] : []);
  const [purposes, setPurposes] = useState<string[]>(initialPurpose ? [initialPurpose] : []);
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const [ngFoods, setNgFoods] = useState<string[]>(initialNgFoods);
  const [budgetMin, setBudgetMin] = useState(8000);
  const [budgetMax, setBudgetMax] = useState(15000);
  const [privateRoom, setPrivate] = useState(false);
  const [quietRoom, setQuiet] = useState(false);
  const [partySize, setPartySize] = useState<number>(initialPartySize ?? 4);
  const [guestBase, setGuestBase] = useState(initialBase);
  const [showBeerModal, setBeerModal] = useState(false);
  const [beerMode, setBeerMode] = useState<'exclude' | 'keep'>('exclude');
  const [beerMakers, setBeerMakers] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [keyword, setKeyword] = useState('');

  // ゲスト選択時の自動補完
  const handleGuestSelect = (gid: string) => {
    setGuestId(gid);
    if (!gid) return;
    const g = allGuests.find(x => x.id === gid);
    if (g) {
      if (g.title && !roles.includes(g.title)) setRoles([g.title]);
      if (g.ngFoods) {
        const newNg = Array.from(new Set([...ngFoods, ...g.ngFoods]));
        setNgFoods(newNg);
      }
      if (g.preferences) {
        const newGenres = Array.from(new Set([...genres, ...g.preferences]));
        setGenres(newGenres);
      }
      if (g.origin) setGuestBase(g.origin);

      const comp = allComps.find(x => x.id === g.companyId);
      if (comp) setCompany(comp.name);
    }
  };

  const handleSubmit = () => {
    onSearch({
      area,
      companyName,
      roles,
      purposes,
      genres,
      budgetMin,
      budgetMax,
      privateRoom,
      quietRoom,
      partySize,
      guestBase,
      guestId,
      beerExclude: { mode: beerMode, makers: beerMakers },
      ngFoods,
      favoritesOnly,
      keyword,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
      {/* キーワード */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">キーワード（店舗名・特徴）</label>
        <input
          type="text"
          placeholder="例: パークハイアット、完全個室"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {/* エリア */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">エリア</label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">すべて</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ゲスト（個人） */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">会食相手（個人・履歴から）</label>
        <Combobox
          placeholder="名前を入力して検索..."
          value={guestId}
          onChange={handleGuestSelect}
          options={allGuests.map(g => ({
            value: g.id,
            label: `${g.name} (${g.title}) - ${allComps.find(c => c.id === g.companyId)?.name}`,
            searchStr: `${g.name} ${g.title} ${allComps.find(c => c.id === g.companyId)?.name}`
          }))}
        />
        <p className="text-[10px] text-navy/40 mt-1">※選択すると会社名・役職・NG食材などが自動でセットされます</p>
      </div>

      {/* 相手企業 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">相手企業名</label>
        <Combobox
          placeholder="例: キリン"
          value={companyName}
          onChange={setCompany}
          allowFreeText={true}
          options={allComps.map(c => ({
            value: c.name,
            label: c.name,
            searchStr: `${c.name} ${c.slug}`
          }))}
        />
      </div>

      {/* 役職 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">ゲストの役職</label>
        <ChipGroup options={ROLES} selected={roles} onChange={setRoles} />
      </div>

      {/* 目的 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">会食の目的</label>
        <ChipGroup options={PURPOSES} selected={purposes} onChange={setPurposes} />
      </div>

      {/* 相手の拠点 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">相手の拠点（動線の考慮）</label>
        <input
          type="text"
          value={guestBase}
          onChange={(e) => setGuestBase(e.target.value)}
          placeholder="例: 東京駅、大手町"
          className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {/* ジャンル (Card Grid UI) */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-3">ジャンル</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {GENRES.map((g) => {
            const isSelected = genres.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  if (isSelected) setGenres(genres.filter(x => x !== g.id));
                  else setGenres([...genres, g.id]);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected
                    ? 'border-gold bg-gold/10 text-gold-dark shadow-sm'
                    : 'border-[#eee6d8] bg-white text-navy/60 hover:border-gold/50 hover:bg-gold/5'
                  }`}
              >
                <span
                  className="material-symbols-outlined text-[24px] mb-1.5 transition-transform group-hover:scale-110"
                  style={{ color: isSelected ? '#a37f2b' : '#9aa0ab' }}
                >
                  {g.icon}
                </span>
                <span className="text-[11.5px] font-bold whitespace-nowrap">{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NG食材 */}
      <div>
        <label className="block text-xs font-semibold text-[#c0504b] mb-2">NG食材・苦手な料理</label>
        {ngFoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ngFoods.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#fdf1f1] border border-[#e0a3a3] text-[#c0504b] px-2 py-0.5 rounded-full">
                {f}
                <button
                  type="button"
                  onClick={() => setNgFoods(ngFoods.filter((x) => x !== f))}
                  className="hover:text-red-700 font-normal ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            id="ng-food-add-input"
            placeholder="例：甲殻類, 生魚"
            className="flex-1 border border-navy/20 rounded-lg px-2.5 py-1.5 text-xs text-navy placeholder:text-navy/30 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = (e.currentTarget.value || '').trim();
                if (val && !ngFoods.includes(val)) {
                  setNgFoods([...ngFoods, val]);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('ng-food-add-input') as HTMLInputElement;
              const val = (el?.value || '').trim();
              if (val && !ngFoods.includes(val)) {
                setNgFoods([...ngFoods, val]);
                if (el) el.value = '';
              }
            }}
            className="px-2.5 py-1 text-xs border border-navy/30 hover:border-navy rounded-lg text-navy bg-white hover:bg-slate-50 cursor-pointer"
          >
            追加
          </button>
        </div>
      </div>

      {/* 予算 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">
          ご予算（円/人）
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(Number(e.target.value))}
            step={1000}
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <span className="text-navy/40 shrink-0">〜</span>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            step={1000}
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
      </div>

      {/* 人数 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">
          参加人数（予定）
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            min={1}
            className="w-24 border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <span className="text-sm text-navy">名</span>
        </div>
      </div>

      {/* 設備・その他 */}
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-2">設備・その他</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-navy">
            <input
              type="checkbox"
              checked={privateRoom}
              onChange={(e) => setPrivate(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            完全個室を優先
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-navy">
            <input
              type="checkbox"
              checked={quietRoom}
              onChange={(e) => setQuiet(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            静かな環境を優先
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-navy mt-1 pt-1 border-t border-navy/5">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="flex items-center gap-1 group-hover:text-gold transition-colors">
              <span className="material-symbols-outlined text-[16px] text-gold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              お気に入りのみ表示
            </span>
          </label>
        </div>
      </div>

      {/* 格式自動判定ピル */}
      <div className="bg-[#faf3e2] rounded-lg px-4 py-2 text-sm text-navy/80">
        格式：<span className="font-semibold">
          {roles.includes('役員・経営層') ? 'S（最高格式）'
            : roles.includes('部長') ? 'A（きちんとした個室店）'
              : 'B（カジュアル）'}
        </span>
        （予算・役職から自動判定）
      </div>

      {/* 個室トグル */}
      <div className="space-y-2">
        {[
          { label: '個室あり', value: privateRoom, set: setPrivate },
          { label: '防音・静かな個室', value: quietRoom, set: setQuiet },
        ].map(({ label, value, set }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => set(!value)}
              className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-gold' : 'bg-navy/20'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-navy">{label}</span>
          </label>
        ))}
      </div>

      {/* 競合ビール除外 */}
      <button
        type="button"
        onClick={() => setBeerModal(true)}
        className="w-full border border-navy/30 rounded-lg py-2 text-sm text-navy hover:bg-navy/5 transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">sports_bar</span>
        競合ビールを除外
        {beerMakers.length > 0 && (
          <span className="bg-gold text-white text-xs rounded-full px-1.5">{beerMakers.length}</span>
        )}
      </button>

      {/* 検索ボタン */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
      >
        {loading ? '検索中...' : 'この条件で探す'}
      </button>

      {/* 競合ビールモーダル */}
      {showBeerModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-navy">競合ビール設定</h3>
            <div className="flex gap-2">
              {(['exclude', 'keep'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBeerMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${beerMode === m ? 'bg-navy text-white' : 'border border-navy/30 text-navy'}`}
                >
                  {m === 'exclude' ? '選択したメーカーを除外' : '選択したメーカーのみ許可'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {BEER_MAKERS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={beerMakers.includes(key)}
                    onChange={(e) =>
                      setBeerMakers(e.target.checked
                        ? [...beerMakers, key]
                        : beerMakers.filter((x) => x !== key))
                    }
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm text-navy">{label}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBeerModal(false)}
              className="w-full py-2 bg-navy text-white rounded-xl text-sm font-semibold"
            >
              完了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
