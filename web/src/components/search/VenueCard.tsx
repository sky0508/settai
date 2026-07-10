import Link from 'next/link';
import type { RankedVenue } from '@/lib/types';

const BADGE_COLOR = {
  OK: { bg: '#e4f0e6', text: '#3d8a5c' },
  '注意': { bg: '#fef6e4', text: '#c07a1e' },
  NG: { bg: '#fdf0f0', text: '#c0504b' },
};

function ScoreRing({ score, badge, size }: { score: number; badge: string; size: number }) {
  const deg = Math.round(score * 3.6);
  const inner = size - 14;
  const { text } = BADGE_COLOR[badge as keyof typeof BADGE_COLOR] ?? { text: '#c2a15a' };
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${text} 0deg ${deg}deg, #ece7db ${deg}deg 360deg)`,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{ width: inner, height: inner, background: '#fff' }}
      >
        <span className="font-serif font-bold text-[13px]" style={{ color: text, lineHeight: 1 }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ label, val }: { label: string; val: number }) {
  return (
    <div>
      <div className="flex justify-between text-[12.5px] mb-1" style={{ color: '#55617a' }}>
        <span>{label}</span>
        <span className="font-bold">{val}%</span>
      </div>
      <div className="h-[7px] rounded overflow-hidden" style={{ background: '#ece9e0' }}>
        <div
          className="h-full rounded"
          style={{ width: `${val}%`, background: '#c2a15a' }}
        />
      </div>
    </div>
  );
}

type Props = { venue: RankedVenue; rank: number; reservationId?: string };

export function VenueCard({ venue, rank, reservationId }: Props) {
  const featured = rank === 1;
  const { bg, text } = BADGE_COLOR[venue.badge] ?? BADGE_COLOR.OK;
  const href = `/venues/${venue.id}?score=${venue.score}&badge=${encodeURIComponent(venue.badge)}&bars=${encodeURIComponent(JSON.stringify(venue.bars))}${reservationId ? `&reservationId=${reservationId}` : ''}`;

  const tagBg = '#f3ead2';
  const tagText = '#9a7a30';

  if (featured) {
    return (
      <Link href={href} className="block group">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #eee6d8', boxShadow: '0 6px 22px rgba(20,35,63,0.05)' }}
        >
          <div className="p-5">
            <div className="flex gap-5 flex-wrap">
              {/* 写真 */}
              <div
                className="relative w-[260px] max-w-full h-[150px] rounded-xl overflow-hidden shrink-0 flex-grow"
                style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)', flexGrow: 1 }}
              >
                {venue.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[38px]" style={{ color: 'rgba(230,201,135,0.32)' }}>restaurant</span>
                    <span className="text-[11px] font-medium tracking-wide" style={{ color: 'rgba(230,201,135,0.45)' }}>{venue.genre}</span>
                  </div>
                )}
                {/* ランクリボン */}
                <div
                  className="absolute top-0 left-4 w-9 h-12 flex items-start justify-center pt-[7px]"
                  style={{ background: 'linear-gradient(#d8b871,#b98f3f)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)' }}
                >
                  <span className="material-symbols-outlined text-[19px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                </div>
              </div>

              {/* 右テキスト */}
              <div className="flex-1 min-w-[230px]">
                <div className="flex flex-wrap gap-[7px] mb-2">
                  {venue.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: tagBg, color: tagText }}>{t}</span>
                  ))}
                </div>
                <h2 className="font-serif font-bold text-[26px] mb-2 leading-snug group-hover:text-gold transition-colors flex items-center gap-2" style={{ color: '#17253f' }}>
                  {venue.name}
                  {venue.isFavorite && (
                    <span className="material-symbols-outlined text-[24px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }} title="お気に入り">star</span>
                  )}
                </h2>
                <div className="flex items-center gap-1 text-[13.5px] mb-2" style={{ color: '#6f7a8f' }}>
                  <span className="material-symbols-outlined text-[17px]" style={{ color: '#c2a15a' }}>place</span>
                  {venue.area} · {venue.nearestStation}駅 徒歩{venue.walkMinutes}分
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[19px] font-bold" style={{ color: '#17253f' }}>
                    ¥{venue.budgetMin.toLocaleString()}〜/人
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: bg, color: text }}>
                    {venue.badge}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px my-5" style={{ background: '#f0ece3' }} />

            {/* 下部グリッド：理由 + スコア */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              {/* 理由 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                  <span className="font-bold text-[15px]" style={{ color: '#17253f' }}>おすすめの理由</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {venue.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed" style={{ color: '#4d5772' }}>
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: '#4aa46e' }}>check_circle</span>
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* スコア */}
              <div style={{ borderLeft: '1px solid #f0ece3', paddingLeft: 22 }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: '#6f7a8f' }}>マッチ度</div>
                    <div className="font-serif font-bold text-[34px] leading-none" style={{ color: '#c2a15a' }}>
                      {venue.score}<span className="text-[18px]">%</span>
                    </div>
                  </div>
                  <ScoreRing score={venue.score} badge={venue.badge} size={72} />
                </div>
                <div className="flex flex-col gap-3">
                  {venue.bars.map((b) => <ScoreBar key={b.label} label={b.label} val={b.val} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // コンパクトカード
  return (
    <Link href={href} className="block group">
      <div
        className="rounded-2xl flex gap-4 items-center flex-wrap cursor-pointer transition-shadow"
        style={{
          background: '#fff',
          border: '1px solid #eee6d8',
          boxShadow: '0 5px 16px rgba(20,35,63,0.04)',
          padding: 16,
        }}
      >
        {/* 写真 */}
        <div
          className="relative w-[150px] h-[104px] rounded-xl overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}
        >
          {venue.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[28px]" style={{ color: 'rgba(230,201,135,0.28)' }}>restaurant</span>
              <span className="text-[10px] font-medium" style={{ color: 'rgba(230,201,135,0.38)' }}>{venue.genre}</span>
            </div>
          )}
          {/* ランク */}
          <div
            className="absolute top-0 left-2.5 w-[26px] h-[34px] flex items-start justify-center pt-1 font-bold text-[13px]"
            style={{
              background: 'rgba(255,255,255,0.85)',
              clipPath: 'polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)',
              color: '#6f7a8f',
            }}
          >
            {rank}
          </div>
        </div>

        {/* 中央テキスト */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {venue.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium" style={{ background: tagBg, color: tagText }}>{t}</span>
            ))}
          </div>
          <div className="font-serif font-bold text-[20px] group-hover:text-gold transition-colors flex items-center gap-1.5" style={{ color: '#17253f' }}>
            {venue.name}
            {venue.isFavorite && (
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }} title="お気に入り">star</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: '#6f7a8f' }}>
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#c2a15a' }}>place</span>
            {venue.area} · {venue.nearestStation}駅 徒歩{venue.walkMinutes}分
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[16px] font-bold" style={{ color: '#17253f' }}>
              ¥{venue.budgetMin.toLocaleString()}〜/人
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[11.5px] font-bold" style={{ background: bg, color: text }}>
              {venue.badge}
            </span>
          </div>
        </div>

        {/* スコア */}
        <div className="w-[160px] shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <div className="text-[11.5px]" style={{ color: '#6f7a8f' }}>マッチ度</div>
              <div className="font-serif font-bold text-[26px] leading-none" style={{ color: '#c2a15a' }}>
                {venue.score}<span className="text-[14px]">%</span>
              </div>
            </div>
            <ScoreRing score={venue.score} badge={venue.badge} size={56} />
          </div>
          {venue.bars[0] && (
            <div>
              <div className="flex justify-between text-[11.5px] mb-1" style={{ color: '#55617a' }}>
                <span>ゲストの好みとの一致</span>
                <span className="font-bold">{venue.bars[0].val}%</span>
              </div>
              <div className="h-1.5 rounded overflow-hidden" style={{ background: '#ece9e0' }}>
                <div className="h-full rounded" style={{ width: `${venue.bars[0].val}%`, background: '#c2a15a' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
