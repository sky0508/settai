'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type Venue = {
  id: string; name: string; genre: string; area: string;
  budgetMin: number; budgetMax: number; formalityGrade: string;
  privateRoomType: string; tags: string[]; nearestStation: string; walkMinutes: number;
  photoUrl: string | null;
};

const GRADES = ['S', 'A', 'B'] as const;
const GRADE_LABEL: Record<string, { icon: string; title: string }> = {
  S: { icon: 'workspace_premium', title: 'S — 最高格式（料亭・高級店）' },
  A: { icon: 'meeting_room',      title: 'A — きちんとした個室店' },
  B: { icon: 'coffee',            title: 'B — カジュアル' },
};
const SCENE_TAGS = ['会食向き', '隠れ家', '個室完備', '静か', '華やか', '眺望', '日本酒充実'];
const AREAS = ['すべて', '京橋', '八重洲', '日本橋'];
const GENRES = ['すべて', '日本料理', '寿司', '鉄板焼き', 'フレンチ', '中華', 'イタリアン', '焼肉'];
const SORTS = [
  { key: 'budget_asc',  label: '予算: 安い順' },
  { key: 'budget_desc', label: '予算: 高い順' },
  { key: 'walk_asc',    label: '駅近順' },
] as const;

type Sort = typeof SORTS[number]['key'];

const selectStyle = {
  width: '100%',
  border: '1.5px solid #e2dccf',
  borderRadius: 9,
  padding: '9px 12px',
  fontSize: 13,
  color: '#3a4661',
  outline: 'none',
  background: '#fff',
} as const;

export default function FavoritesClient({ venues }: { venues: Venue[] }) {
  const [tab, setTab]       = useState<'formality' | 'scene'>('formality');
  const [area, setArea]     = useState('すべて');
  const [genre, setGenre]   = useState('すべて');
  const [sort, setSort]     = useState<Sort>('budget_asc');
  const [maxBudget, setMax] = useState(30000);

  const filtered = useMemo(() => {
    let list = [...venues];
    if (area !== 'すべて') list = list.filter((v) => v.area === area);
    if (genre !== 'すべて') list = list.filter((v) => v.genre === genre);
    list = list.filter((v) => v.budgetMax <= maxBudget);
    if (sort === 'budget_asc')  list.sort((a, b) => a.budgetMax - b.budgetMax);
    if (sort === 'budget_desc') list.sort((a, b) => b.budgetMax - a.budgetMax);
    if (sort === 'walk_asc')    list.sort((a, b) => a.walkMinutes - b.walkMinutes);
    return list;
  }, [venues, area, genre, sort, maxBudget]);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
      {/* ヘッダ */}
      <div className="flex items-end gap-3 flex-wrap mb-5">
        <div>
          <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] m-0" style={{ color: '#17253f' }}>
            お気に入り
          </h1>
          <div className="text-[13.5px] mt-1" style={{ color: '#6f7a8f' }}>
            保存したお店を、格式とシーンで管理
          </div>
        </div>
        {/* タブ切替：ピル型 */}
        <div className="ml-auto flex rounded-xl p-1" style={{ background: '#efe9dd' }}>
          {(['formality', 'scene'] as const).map((t) => (
            <span
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-[13.5px] font-bold cursor-pointer transition-all"
              style={tab === t
                ? { background: '#fff', color: '#c2a15a', boxShadow: '0 2px 6px rgba(20,35,63,0.08)' }
                : { color: '#8a93a4' }
              }
            >
              {t === 'formality' ? '格式別' : 'シーン別'}
            </span>
          ))}
        </div>
      </div>

      {/* フィルタバー */}
      <div
        className="flex gap-3 flex-wrap items-center mb-5 p-3.5"
        style={{
          background: '#fff',
          border: '1px solid #eee6d8',
          borderRadius: 14,
          boxShadow: '0 5px 16px rgba(20,35,63,0.04)',
        }}
      >
        <div className="min-w-[130px] flex-1">
          <div className="text-[11px] mb-0.5" style={{ color: '#9aa0ab' }}>エリア</div>
          <select value={area} onChange={(e) => setArea(e.target.value)} style={selectStyle}>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="text-[11px] mb-0.5" style={{ color: '#9aa0ab' }}>ジャンル</div>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} style={selectStyle}>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="text-[11px] mb-0.5" style={{ color: '#9aa0ab' }}>並び替え</div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={selectStyle}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="min-w-[120px] flex-1">
          <div className="text-[11px] mb-0.5" style={{ color: '#9aa0ab' }}>予算上限</div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMax(Number(e.target.value))}
              step={5000}
              style={{ ...selectStyle, width: '100%' }}
            />
            <span className="text-[12px] shrink-0" style={{ color: '#6f7a8f' }}>円</span>
          </div>
        </div>
        <div
          className="w-[42px] h-[42px] border rounded-xl flex items-center justify-center self-end cursor-pointer"
          style={{ border: '1.5px solid #e2dccf' }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ color: '#8a93a4' }}>tune</span>
        </div>
        <span className="text-[12px] self-end pb-1" style={{ color: '#9aa0ab' }}>{filtered.length}件</span>
      </div>

      {/* 格式別 */}
      {tab === 'formality' && (
        <div className="flex flex-col gap-7">
          {GRADES.map((grade) => {
            const list = filtered.filter((v) => v.formalityGrade === grade);
            const { icon, title } = GRADE_LABEL[grade];
            return (
              <div key={grade}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[21px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <h2 className="font-serif font-bold text-[18px] m-0" style={{ color: '#17253f' }}>{title}</h2>
                  <a href="#" className="ml-auto text-[13px] flex items-center gap-0.5" style={{ color: '#a37f2b' }}>
                    すべて見る
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </a>
                </div>
                {list.length === 0
                  ? <p className="text-[13px]" style={{ color: '#9aa0ab' }}>該当なし</p>
                  : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
                      {list.map((v) => <VenueCard key={v.id} venue={v} />)}
                    </div>
                  )
                }
              </div>
            );
          })}
        </div>
      )}

      {/* シーン別 */}
      {tab === 'scene' && (
        <div className="flex flex-col gap-7">
          {SCENE_TAGS.map((tag) => {
            const list = filtered.filter((v) => v.tags.includes(tag));
            if (list.length === 0) return null;
            return (
              <div key={tag}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[21px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }}>label</span>
                  <h2 className="font-serif font-bold text-[18px] m-0" style={{ color: '#17253f' }}># {tag}</h2>
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
                  {list.map((v) => <VenueCard key={v.id} venue={v} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link href={`/venues/${venue.id}`} className="block group">
      <div
        className="overflow-hidden cursor-pointer flex transition-shadow"
        style={{
          background: '#fff',
          border: '1px solid #eee6d8',
          borderRadius: 14,
          boxShadow: '0 5px 16px rgba(20,35,63,0.05)',
        }}
      >
        {/* 左：写真 */}
        <div
          className="w-24 shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}
        >
          {venue.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="material-symbols-outlined text-[26px]" style={{ color: 'rgba(230,201,135,0.3)' }}>restaurant</span>
          )}
        </div>
        {/* 右：情報 */}
        <div className="flex-1 min-w-0 p-3.5">
          <div className="font-serif font-bold text-[15px] leading-snug group-hover:text-gold transition-colors" style={{ color: '#17253f' }}>
            {venue.name}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: '#9aa0ab' }}>{venue.genre}</div>
          <div className="text-[13px] font-bold mt-0.5" style={{ color: '#a37f2b' }}>
            ¥{venue.budgetMax.toLocaleString()}〜
          </div>
          <div className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: '#6f7a8f' }}>
            {venue.nearestStation}駅 徒歩{venue.walkMinutes}分 · {venue.privateRoomType}
          </div>
          <span
            className="inline-block mt-2 text-[11.5px] font-bold rounded-full px-2.5 py-0.5"
            style={{ background: '#e4f0e6', color: '#3d8a5c' }}
          >
            格式{venue.formalityGrade}
          </span>
        </div>
      </div>
    </Link>
  );
}
