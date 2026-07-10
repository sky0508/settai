'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { saveRecord } from './actions';

const WENT_WELL_OPTIONS = ['料理', '個室', 'サービス', '話題', '店の格'];
const OUTCOMES = ['商談前進', '関係深化', '次アポ獲得', '特になし'] as const;

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 flex-wrap">
      <span
        className="text-[14px] font-bold shrink-0 mt-2"
        style={{ width: 96, color: '#3a4661' }}
      >
        {label}
      </span>
      <div className="flex-1 min-w-[200px]">{children}</div>
    </div>
  );
}

type Props = {
  allVenues: { id: string; name: string }[];
  allGuests: { id: string; name: string; title: string; companyId: string }[];
  allComps: { id: string; name: string }[];
};

export default function RecordForm({ allVenues, allGuests, allComps }: Props) {
  return (
    <Suspense>
      <RecordFormInner allVenues={allVenues} allGuests={allGuests} allComps={allComps} />
    </Suspense>
  );
}

function RecordFormInner({ allVenues, allGuests, allComps }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialVenueId = searchParams.get('venueId') ?? '';
  const initialGuestId = searchParams.get('guestId') ?? '';

  const [venueId, setVenueId] = useState(initialVenueId);
  const [guestId, setGuestId] = useState(initialGuestId);

  const today = new Date().toISOString().split('T')[0];
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [wentWell, setWentWell] = useState<string[]>([]);
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);
  const [decidedAt, setDecidedAt] = useState(today);

  const toggleChip = (v: string) =>
    setWentWell((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venueId) return alert('店舗を選択してください');
    if (!guestId) return alert('ゲストを選択してください');

    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set('venueId', venueId);
    fd.set('guestId', guestId);
    fd.set('rating', String(rating));
    fd.set('wentWell', wentWell.join('、'));
    fd.set('businessOutcome', outcome);
    fd.set('decidedAt', decidedAt);
    try {
      await saveRecord(fd);
    } catch (err) {
      // Next.js redirect は内部的に throw するので再スロー
      if (err && typeof err === 'object' && 'digest' in err) throw err;
      console.error(err);
      alert('保存に失敗しました。もう一度お試しください。');
      setSaving(false);
    }
  };

  const fieldStyle = {
    flex: 1,
    minWidth: 200,
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    border: '1.5px solid #dfe3ea',
    borderRadius: 11,
    padding: '13px 15px',
    background: '#fbfbfc',
  } as const;

  const chipBase = 'px-3 py-1.5 rounded-full text-[14px] border transition-colors cursor-pointer';

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(16px,3vw,40px)' }}>
      <h1 className="font-serif font-bold text-[clamp(26px,3.6vw,38px)] m-0 mb-1" style={{ color: '#14233f' }}>
        会食を記録する
      </h1>
      <div className="w-14 h-[3px] rounded mb-7" style={{ background: '#c2a15a' }} />

      <div
        className="flex flex-col gap-5 p-[clamp(18px,2.6vw,32px)]"
        style={{
          background: '#fff',
          border: '1px solid #eee6d8',
          borderRadius: 18,
          boxShadow: '0 10px 30px rgba(20,35,63,0.06)',
        }}
      >
        {/* 店舗とゲスト選択 */}
        <Row label="会食店舗">
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full text-[14.5px] outline-none"
            style={fieldStyle}
          >
            <option value="">店舗を選択...</option>
            {allVenues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Row>

        <Row label="会食相手">
          <select
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            className="w-full text-[14.5px] outline-none"
            style={fieldStyle}
          >
            <option value="">ゲストを選択...</option>
            {allComps.map(c => {
              const cGuests = allGuests.filter(g => g.companyId === c.id);
              if (cGuests.length === 0) return null;
              return (
                <optgroup key={c.id} label={c.name}>
                  {cGuests.map(g => <option key={g.id} value={g.id}>{g.name} ({g.title})</option>)}
                </optgroup>
              );
            })}
          </select>
        </Row>

        {/* 日時選択 */}
        <Row label="会食日時">
          <div style={{ ...fieldStyle, padding: 0, overflow: 'hidden' }}>
            <span className="material-symbols-outlined text-[20px] ml-4" style={{ color: '#c2a15a' }}>calendar_today</span>
            <input
              type="date"
              value={decidedAt}
              onChange={(e) => setDecidedAt(e.target.value)}
              className="flex-1 text-[14.5px] outline-none px-3 py-3 bg-transparent"
              style={{ color: '#22314f' }}
            />
          </div>
        </Row>

        <div className="h-px" style={{ background: '#f0ece3' }} />

        {/* 総合評価 */}
        <Row label="総合評価">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="text-[32px] cursor-pointer transition-transform hover:scale-110 select-none material-symbols-outlined"
                style={{
                  color: (hover || rating) >= n ? '#e0aa33' : '#dfe3ea',
                  fontVariationSettings: `'FILL' ${(hover || rating) >= n ? 1 : 0}`,
                }}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
              >
                star
              </span>
            ))}
          </div>
        </Row>

        {/* 良かった点 */}
        <Row label="良かった点">
          <div className="flex flex-wrap gap-2.5">
            {WENT_WELL_OPTIONS.map((o) => (
              <span
                key={o}
                onClick={() => toggleChip(o)}
                className={chipBase}
                style={wentWell.includes(o)
                  ? { background: '#14233f', color: '#fff', borderColor: '#14233f' }
                  : { background: '#fff', color: '#3a4661', borderColor: '#dfe3ea' }
                }
              >
                {o}
                {wentWell.includes(o) && (
                  <span className="material-symbols-outlined text-[16px] ml-1 align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </span>
            ))}
          </div>
        </Row>

        {/* 反省点 */}
        <Row label={<>反省点・<br />申し送り</>}>
          <textarea
            name="reflection"
            rows={4}
            placeholder="例）料理の提供タイミングが良かった。次回は◯◯の話題を深掘りする。"
            className="w-full outline-none resize-y text-[14px] leading-relaxed"
            style={{
              border: '1.5px solid #dfe3ea',
              borderRadius: 11,
              padding: '14px 15px',
              color: '#22314f',
              minHeight: 96,
            }}
          />
        </Row>

        {/* 業務成果 */}
        <Row label="業務成果">
          <div className="flex overflow-hidden flex-wrap" style={{ border: '1.5px solid #dfe3ea', borderRadius: 11 }}>
            {OUTCOMES.map((o) => (
              <span
                key={o}
                onClick={() => setOutcome(o)}
                className="flex-1 min-w-[80px] shrink-0 py-3 text-center text-[14px] cursor-pointer font-medium transition-colors border-r border-[#dfe3ea] last:border-0"
                style={outcome === o
                  ? { background: '#14233f', color: '#fff' }
                  : { color: '#3a4661' }
                }
              >
                {o}
              </span>
            ))}
          </div>
        </Row>

        {/* 送信 */}
        <div className="flex gap-3 mt-1.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-none px-6 py-4 rounded-[13px] font-bold text-[15px] border cursor-pointer transition-colors"
            style={{ color: '#3a4661', borderColor: '#e2dccf', background: '#fff' }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving || rating === 0 || !venueId || !guestId}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[13px] text-white font-bold text-[16px] disabled:opacity-50 transition-opacity cursor-pointer"
            style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 8px 20px rgba(184,148,74,0.3)' }}
          >
            <span className="material-symbols-outlined text-[22px]">edit_document</span>
            {saving ? '保存中...' : '記録する'}
          </button>
        </div>
      </div>
    </form>
  );
}
