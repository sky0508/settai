import { db } from '@/lib/db/client';
import { records, venues, reservations, guests, companies } from '@/lib/db/schema';
import { desc, count, eq } from 'drizzle-orm';
import Link from 'next/link';
import { deleteRecord } from '@/app/record/actions';
import DeleteButton from '@/components/ui/DeleteButton';

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];

function fmtDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MOCK_UPCOMING = [
  { id: 'u1', date: '7/15', dow: '火', store: '個室会席 北大路 京橋茶寮', venueId: 'mock', name: '田中 一郎 様', company: 'キリンビール', status: '確定' },
  { id: 'u2', date: '7/22', dow: '火', store: '日本料理 日本橋ゆかり', venueId: 'mock', name: '山本 太郎 様', company: 'アサヒグループ', status: '調整中' },
];

const MOCK_RECENT = [
  { id: 'm1', venueId: null, venueName: '個室会席 北大路 京橋茶寮', rating: 5, businessOutcome: '商談前進', wentWell: '個室・料理・サービス', createdAt: new Date('2025-11-15') },
  { id: 'm2', venueId: null, venueName: '京橋たけ本', rating: 4, businessOutcome: '関係深化', wentWell: '料理・店の格', createdAt: new Date('2025-07-20') },
];

const MOCK_TOP5 = [
  { rank: 1, id: 'm1', name: '個室会席 北大路 京橋茶寮', area: '京橋', count: 8, avgBudget: '¥16,500', avg: '4.6' },
  { rank: 2, id: 'm2', name: '京橋たけ本', area: '宝町', count: 5, avgBudget: '¥19,000', avg: '4.4' },
  { rank: 3, id: 'm3', name: '日本料理 日本橋ゆかり', area: '日本橋', count: 4, avgBudget: '¥20,000', avg: '4.2' },
  { rank: 4, id: 'm4', name: '完全個室懐石 柚こう', area: '日本橋', count: 3, avgBudget: '¥18,700', avg: '4.1' },
  { rank: 5, id: 'm5', name: '八重洲 鮨 海味', area: '八重洲', count: 2, avgBudget: '¥25,000', avg: '4.0' },
];

export default async function DashboardPage() {
  const [allRecords, venueCount, recentRecords, allVenueRows, allReservations, allGuests, sClassVenues] = await Promise.all([
    db.select().from(records).orderBy(desc(records.createdAt)),
    db.select({ count: count() }).from(venues),
    db.select({
      id: records.id,
      venueId: records.venueId,
      rating: records.rating,
      businessOutcome: records.businessOutcome,
      createdAt: records.createdAt,
      wentWell: records.wentWell,
    }).from(records).orderBy(desc(records.createdAt)).limit(4),
    db.select({ id: venues.id, name: venues.name, area: venues.area, budgetMax: venues.budgetMax }).from(venues),
    db.select().from(reservations).orderBy(desc(reservations.scheduledAt)),
    db.select({ id: guests.id, name: guests.name, title: guests.title, companyName: companies.name }).from(guests).leftJoin(companies, eq(guests.companyId, companies.id)),
    db.select().from(venues).where(eq(venues.formalityGrade, 'S')).limit(4),
  ]);

  const isMock = allRecords.length === 0 && allReservations.length === 0;
  const now = new Date();

  // Upcoming: actually filter reservations
  const upcoming = allReservations
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 4);

  const thisMonth = allRecords.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const rated = allRecords.filter((r) => r.rating != null);
  const avgRating = rated.length > 0
    ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1)
    : null;

  const venueCounts: Record<string, number> = {};
  const venueRatings: Record<string, number[]> = {};
  for (const r of allRecords) {
    if (r.venueId) {
      venueCounts[r.venueId] = (venueCounts[r.venueId] ?? 0) + 1;
      if (r.rating != null) (venueRatings[r.venueId] ??= []).push(r.rating);
    }
  }
  const realTop5 = Object.entries(venueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, cnt], i) => {
      const v = allVenueRows.find((x) => x.id === id);
      const rs = venueRatings[id] ?? [];
      const avg = rs.length ? (rs.reduce((s, x) => s + x, 0) / rs.length).toFixed(1) : '—';
      return { rank: i + 1, id, name: v?.name ?? '—', area: v?.area ?? '—', avgBudget: v ? `¥${v.budgetMax.toLocaleString()}` : '—', count: cnt, avg };
    });

  const top5 = isMock ? MOCK_TOP5 : realTop5;

  const stats = isMock
    ? [
      { icon: 'calendar_month', label: '今月の会食件数', val: 12, unit: '件', star: false, delta: '前月比 +2件' },
      { icon: 'star', label: '平均満足度', val: '4.3', unit: null, star: true, delta: '前月比 +0.2' },
      { icon: 'storefront', label: '登録店舗', val: venueCount[0]?.count ?? 0, unit: '件', star: false, delta: null },
    ]
    : [
      { icon: 'calendar_month', label: '今月の会食件数', val: thisMonth.length, unit: '件', star: false, delta: null },
      { icon: 'star', label: '平均満足度', val: avgRating ?? '—', unit: null, star: !!avgRating, delta: null },
      { icon: 'storefront', label: '登録店舗', val: venueCount[0]?.count ?? 0, unit: '件', star: false, delta: null },
    ];

  // 1. Business Outcomes breakdown
  const outcomeCounts: Record<string, number> = {};
  for (const r of allRecords) {
    const outcome = r.businessOutcome || '未設定';
    outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1;
  }
  const displayOutcomes = isMock
    ? [
      { label: '関係強化', count: 8, color: '#c2a15a' },
      { label: '商談前進', count: 5, color: '#3d8a5c' },
      { label: '謝罪解決', count: 2, color: '#c0504b' },
      { label: 'その他', count: 1, color: '#8a93a4' },
    ]
    : Object.entries(outcomeCounts).map(([label, count], idx) => {
      const colors = ['#c2a15a', '#3d8a5c', '#c0504b', '#8a93a4', '#b87333', '#4e5a70'];
      return {
        label,
        count,
        color: colors[idx % colors.length],
      };
    });

  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.9
  const totalOutcomesCount = displayOutcomes.reduce((sum, item) => sum + item.count, 0);

  let accumulatedPercent = 0;
  const donutSlices = displayOutcomes.map((item) => {
    const percent = totalOutcomesCount > 0 ? item.count / totalOutcomesCount : 0;
    const strokeLength = percent * circumference;
    const strokeOffset = circumference - (accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDashArray: `${strokeLength} ${circumference - strokeLength}`,
      strokeDashOffset: strokeOffset,
    };
  });

  // 2. Monthly Trend (Last 6 Months)
  const monthsData: { monthStr: string; count: number; avgRating: number }[] = [];
  const nowTemp = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowTemp.getFullYear(), nowTemp.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsData.push({ monthStr, count: 0, avgRating: 0 });
  }

  const monthlySums: Record<string, { count: number; ratingSum: number; ratingCount: number }> = {};
  for (const r of allRecords) {
    const d = new Date(r.decidedAt || r.createdAt);
    const mKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (mKey in monthlySums || monthsData.some(m => m.monthStr === mKey)) {
      monthlySums[mKey] ??= { count: 0, ratingSum: 0, ratingCount: 0 };
      monthlySums[mKey].count++;
      if (r.rating != null) {
        monthlySums[mKey].ratingSum += r.rating;
        monthlySums[mKey].ratingCount++;
      }
    }
  }

  for (const m of monthsData) {
    const sum = monthlySums[m.monthStr];
    if (sum) {
      m.count = sum.count;
      m.avgRating = sum.ratingCount > 0 ? Number((sum.ratingSum / sum.ratingCount).toFixed(1)) : 0;
    }
  }

  const displayTrends = isMock
    ? [
      { monthStr: '11月', count: 3, avgRating: 4.2 },
      { monthStr: '12月', count: 5, avgRating: 4.5 },
      { monthStr: '1月', count: 4, avgRating: 4.0 },
      { monthStr: '2月', count: 6, avgRating: 4.3 },
      { monthStr: '3月', count: 8, avgRating: 4.7 },
      { monthStr: '4月', count: 9, avgRating: 4.6 },
    ]
    : monthsData.map(m => ({ ...m, monthStr: `${parseInt(m.monthStr.slice(5))}月` }));

  const maxCount = Math.max(5, ...displayTrends.map((d) => d.count)) + 1;
  const chartWidth = 460;
  const chartHeight = 150;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 20;
  const paddingBottom = 20;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = plotWidth / (displayTrends.length - 1);

  // Line points string
  const linePoints = displayTrends.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + plotHeight - (d.avgRating / 5.0) * plotHeight;
    return `${x},${y}`;
  }).join(' ');

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eee6d8',
    borderRadius: 16,
    boxShadow: '0 6px 22px rgba(20,35,63,0.05)',
  } as const;

  const displayUpcoming = isMock ? MOCK_UPCOMING : upcoming.map((r) => {
    const d = new Date(r.scheduledAt!);
    const venue = allVenueRows.find((v) => v.id === r.venueId);
    const guest = allGuests.find((g) => g.id === r.guestId);

    return {
      id: r.id,
      date: fmtDate(d),
      dow: DOW_JA[d.getDay()],
      store: venue?.name ?? '—',
      venueId: r.venueId,
      name: guest ? `${guest.name} 様` : '—',
      company: guest?.companyName ?? '—',
      status: r.status === 'confirmed' ? '確定' : r.status === 'pending' ? '調整中' : r.status
    };
  });

  const displayRecent = isMock ? MOCK_RECENT : recentRecords.map((r) => ({
    id: r.id,
    venueId: r.venueId,
    venueName: allVenueRows.find((v) => v.id === r.venueId)?.name ?? '—',
    rating: r.rating,
    businessOutcome: r.businessOutcome,
    wentWell: r.wentWell,
    createdAt: new Date(r.createdAt),
  }));

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
      {/* ヘッダ */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] m-0" style={{ color: '#17253f' }}>
          ダッシュボード
        </h1>
        {isMock && (
          <span className="text-[11.5px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#f4ead4', color: '#9a7028' }}>
            サンプルデータ表示中
          </span>
        )}
        <Link
          href="/search"
          className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl text-white text-[14px] font-bold"
          style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 6px 16px rgba(184,148,74,0.3)' }}
        >
          <span className="material-symbols-outlined text-[19px]">search</span>
          お店を探す
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 p-6" style={cardStyle}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#f4ead4' }}
            >
              <span className="material-symbols-outlined text-[27px]" style={{ color: '#bf9540' }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: '#6f7a8f' }}>{s.label}</div>
              <div className="flex items-baseline gap-1 my-0.5">
                {s.star && (
                  <span className="material-symbols-outlined text-[26px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                )}
                <span className="font-serif font-bold text-[32px] leading-none" style={{ color: '#17253f' }}>{s.val}</span>
                {s.unit && <span className="text-[14px]" style={{ color: '#6f7a8f' }}>{s.unit}</span>}
              </div>
              {s.delta && (
                <div className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#3d8a5c' }}>
                  {s.delta}
                  <span className="material-symbols-outlined text-[15px]">trending_up</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 会食アナリティクス */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
        {/* 商談成果の分布 (Pie Donut Chart) */}
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6" style={cardStyle}>
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>analytics</span>
              <span className="font-serif font-bold text-[15px]" style={{ color: '#17253f' }}>会食成果の分布</span>
            </div>
            <div className="space-y-2 mt-2">
              {displayOutcomes.map((item, idx) => {
                const countPercent = totalOutcomesCount > 0 ? Math.round((item.count / totalOutcomesCount) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs text-navy/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium truncate">{item.label}</span>
                    </div>
                    <span className="font-bold shrink-0 text-navy/60">{item.count}件 ({countPercent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative shrink-0 flex items-center justify-center">
            {totalOutcomesCount === 0 ? (
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-navy/10 flex items-center justify-center text-[11px] text-navy/40">データなし</div>
            ) : (
              <svg width="110" height="110" viewBox="0 0 90 90" className="select-none">
                <circle cx="45" cy="45" r="35" fill="transparent" stroke="#f2efe8" strokeWidth="8" />
                {donutSlices.map((slice, i) => (
                  <circle
                    key={i}
                    cx="45"
                    cy="45"
                    r="35"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="8"
                    strokeDasharray={slice.strokeDashArray}
                    strokeDashoffset={slice.strokeDashOffset}
                    transform="rotate(-90 45 45)"
                  />
                ))}
                <g transform="translate(45 45)" textAnchor="middle">
                  <text dy="-1" fontStyle="serif" fontWeight="bold" fontSize="13" fill="#17253f">
                    {totalOutcomesCount}
                  </text>
                  <text dy="10" fontSize="6.5" fill="#9aa0ab" letterSpacing="0.05em">
                    総件数
                  </text>
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* 月別件数 & 満足度推移 (SVG Line & Bar combined) */}
        <div className="p-6 flex flex-col justify-between" style={cardStyle}>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>trending_up</span>
              <span className="font-serif font-bold text-[15px]" style={{ color: '#17253f' }}>月別開催数 & 平均満足度</span>
            </div>
            {/* 凡例 */}
            <div className="flex items-center gap-3 text-[11px] text-navy/50">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 bg-[#dfe3ea] rounded-sm" />
                <span>開催数</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#c2a15a]" />
                <span className="w-1.5 h-1.5 bg-[#c2a15a] rounded-full -ml-2 mr-1" />
                <span>満足度</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden mt-1">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
              {/* グリッド横線 */}
              {[0, 1, 2, 3].map((gridIndex) => {
                const y = paddingTop + (plotHeight / 3) * gridIndex;
                const valueLabel = (5.0 - 1.66 * gridIndex).toFixed(1);
                return (
                  <g key={gridIndex}>
                    <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#f0ece3" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" fontSize="9" fill="#9aa0ab">{valueLabel}</text>
                  </g>
                );
              })}

              {/* 開催数バーのグループ */}
              {displayTrends.map((d, i) => {
                const x = paddingLeft + i * stepX;
                const barHeight = maxCount > 0 ? (d.count / maxCount) * plotHeight : 0;
                const barWidth = 14;
                const rx = 3;
                return (
                  <g key={i}>
                    <rect
                      x={x - barWidth / 2}
                      y={paddingTop + plotHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      fill="#e4e7ed"
                      rx={rx}
                    />
                    <text x={x} y={paddingTop + plotHeight - barHeight - 4} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#7a8296">{d.count}件</text>
                  </g>
                );
              })}

              {/* 折れ線（満足度） */}
              {displayTrends.length > 0 && (
                <>
                  <polyline
                    fill="none"
                    stroke="#c2a15a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={linePoints}
                  />
                  {displayTrends.map((d, i) => {
                    const x = paddingLeft + i * stepX;
                    const y = paddingTop + plotHeight - (d.avgRating / 5.0) * plotHeight;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#c2a15a" strokeWidth="2.5" />
                        {d.avgRating > 0 && (
                          <text x={x} y={y - 8} textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#8a6a1f">★{d.avgRating}</text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* X軸ラベル */}
              {displayTrends.map((d, i) => {
                const x = paddingLeft + i * stepX;
                return (
                  <text key={i} x={x} y={chartHeight - 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6f7a8f">
                    {d.monthStr}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 2カラム：予定 + 最近の記録 */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
        {/* 今後の会食予定 */}
        <div className="p-[22px]" style={cardStyle}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[21px]" style={{ color: '#c2a15a' }}>event</span>
              <span className="font-serif font-bold text-[16px]" style={{ color: '#17253f' }}>今後の会食予定</span>
            </div>
            <Link
              href="/reservations/new"
              className="text-[12px] font-bold px-3 py-1.5 rounded-lg border border-[#e2dccf] hover:bg-slate-50 transition-colors"
              style={{ color: '#c2a15a' }}
            >
              ＋予定を追加
            </Link>
          </div>
          {displayUpcoming.length === 0 ? (
            <p className="text-[14px] text-center py-4" style={{ color: '#9aa0ab' }}>予定はありません</p>
          ) : (
            <div className="flex flex-col">
              {displayUpcoming.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 py-3 flex-wrap"
                  style={{ borderBottom: '1px solid #f2efe8' }}
                >
                  <div className="text-center shrink-0 w-[42px]">
                    <div className="font-bold text-[15px]" style={{ color: '#17253f' }}>{u.date}</div>
                    <div className="text-[11px]" style={{ color: '#9aa0ab' }}>({u.dow})</div>
                  </div>
                  {u.name && (
                    <div className="flex-1 min-w-[120px]">
                      <div className="text-[14px] font-medium" style={{ color: '#22314f' }}>{u.name}</div>
                      <div className="text-[11.5px]" style={{ color: '#9aa0ab' }}>{u.company}</div>
                    </div>
                  )}
                  <div
                    className="w-[38px] h-[38px] rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'rgba(230,201,135,0.4)' }}>restaurant</span>
                  </div>
                  {u.venueId ? (
                    <div className="text-[13px] shrink-0" style={{ color: '#3a4661' }}>{u.store}</div>
                  ) : (
                    <Link
                      href={`/search?reservationId=${u.id}`}
                      className="flex items-center gap-1 text-[12.5px] font-bold rounded-lg px-2.5 py-1.5 shrink-0 transition-colors"
                      style={{ background: '#fbf3df', border: '1px solid #ecd9a8', color: '#a37f2b' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">search</span>
                      お店を探す
                    </Link>
                  )}
                  <span
                    className="text-[11.5px] font-bold rounded-full px-2.5 py-0.5 shrink-0"
                    style={u.status === '確定'
                      ? { background: '#e4f0e6', color: '#3d8a5c' }
                      : { background: '#f6ecd2', color: '#a37f2b' }}
                  >
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近の会食記録 */}
        <div className="p-[22px]" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[21px]" style={{ color: '#c2a15a' }}>history_edu</span>
            <span className="font-serif font-bold text-[16px]" style={{ color: '#17253f' }}>最近の会食記録</span>
          </div>
          {displayRecent.length === 0 ? (
            <p className="text-[14px] text-center py-4" style={{ color: '#9aa0ab' }}>まだ記録がありません</p>
          ) : (
            <div className="flex flex-col">
              {displayRecent.map((r) => {
                const doDelete = deleteRecord.bind(null, r.id);
                return (
                  <div
                    key={r.id}
                    className="flex gap-3 py-3 items-start"
                    style={{ borderBottom: '1px solid #f2efe8' }}
                  >
                    <div className="flex flex-col items-center shrink-0 pt-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: r.rating && r.rating >= 4 ? '#4aa46e' : '#c2a15a' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[13px]" style={{ color: '#9aa0ab' }}>
                          {fmtDate(r.createdAt)}（{DOW_JA[r.createdAt.getDay()]}）
                        </div>
                        {r.rating != null && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                            <b className="text-[14px]" style={{ color: '#17253f' }}>{r.rating}</b>
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                        {r.venueId ? (
                          <Link href={`/venues/${r.venueId}`} className="text-[14px] font-medium hover:text-gold transition-colors" style={{ color: '#22314f' }}>
                            {r.venueName}
                          </Link>
                        ) : (
                          <span className="text-[14px] font-medium" style={{ color: '#22314f' }}>{r.venueName}</span>
                        )}
                        {r.businessOutcome && (
                          <span className="text-[13px]" style={{ color: '#55617a' }}>{r.businessOutcome}</span>
                        )}
                      </div>
                      {r.wentWell && (
                        <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: '#6f7a8f' }}>
                          良かった点：{r.wentWell}
                        </div>
                      )}
                    </div>
                    {/* 削除 */}
                    <form action={doDelete}>
                      <DeleteButton
                        className="text-navy/20 hover:text-ng transition-colors cursor-pointer mt-1"
                        title="会食記録を削除"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </DeleteButton>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======= 新設: キュレーションセクション ======= */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>

        {/* レコメンド：経営層向け Sクラス */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="font-serif font-bold text-[15.5px]" style={{ color: '#17253f' }}>経営層向け 極上店 (Sクラス)</span>
            </div>
            <Link href="/search?role=役員・経営層" className="text-[12px] font-bold hover:underline" style={{ color: '#c2a15a' }}>
              もっと見る
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sClassVenues.map(v => (
              <Link key={v.id} href={`/venues/${v.id}`} className="block group">
                <div className="bg-navy rounded-xl overflow-hidden relative aspect-video shadow-sm transition-transform group-hover:scale-[1.02]">
                  {v.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy" style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}>
                      <span className="material-symbols-outlined text-[24px]" style={{ color: 'rgba(230,201,135,0.4)' }}>restaurant</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                    <div className="text-white">
                      <div className="text-[10px] font-bold bg-[#c2a15a] text-white px-1.5 py-0.5 rounded-sm inline-block mb-1 shadow-sm leading-none">Sクラス</div>
                      <div className="text-[12.5px] font-bold leading-tight line-clamp-1 group-hover:text-gold transition-colors text-shadow-sm">{v.name}</div>
                      <div className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{v.area}・{v.genre}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 目的別ショートカット */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>category</span>
            <span className="font-serif font-bold text-[15.5px]" style={{ color: '#17253f' }}>会食の目的から探す</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'business', label: '商談・会食', icon: 'handshake', desc: 'ビジネスの重要な局面に', tags: '完全個室 / 高級和食' },
              { id: 'apology', label: '謝罪・お詫び', icon: 'front_hand', desc: '誠意を伝える格式高い場', tags: '完全個室 / 落ち着いた環境' },
              { id: 'welcome', label: '歓送迎・打ち上げ', icon: 'celebration', desc: '大人数で和やかに過ごす', tags: '半個室 / 焼き肉など' },
              { id: 'casual', label: '関係構築（カジュアル）', icon: 'local_cafe', desc: '肩肘張らない距離感で', tags: 'テーブル席 / イタリアン' }
            ].map(p => (
              <Link
                key={p.id}
                href={`/search?purpose=${p.id === 'business' ? '会食' : p.id === 'apology' ? '謝罪' : p.id === 'welcome' ? '打ち上げ' : '懇親'}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-[#eee6d8] hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f4ead4' }}>
                  <span className="material-symbols-outlined text-[22px]" style={{ color: '#bf9540' }}>{p.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold text-navy group-hover:text-gold transition-colors">{p.label}</div>
                  <div className="text-[11px] text-navy/50">{p.desc}</div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-navy/20 group-hover:text-gold transition-colors">chevron_right</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {/* ============================================== */}

      {/* TOP5 テーブル */}
      <div className="p-[22px]" style={cardStyle}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[22px]" style={{ color: '#c2a15a', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <span className="font-serif font-bold text-[16px]" style={{ color: '#17253f' }}>よく使われる店 TOP5</span>
          <Link href="/map" className="ml-auto flex items-center gap-1 text-[12.5px] font-medium hover:text-gold transition-colors" style={{ color: '#8a93a4' }}>
            <span className="material-symbols-outlined text-[16px]">map</span>
            地図で見る
          </Link>
        </div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 600 }}>
            <div
              className="grid text-[12px] px-2 py-2.5"
              style={{ gridTemplateColumns: '56px 2fr 1fr 1fr 1fr 1fr', color: '#9aa0ab', borderBottom: '1px solid #ece6da' }}
            >
              <span>順位</span><span>店舗名</span><span>エリア</span><span>利用回数</span><span>平均予算</span><span>平均評価</span>
            </div>
            {top5.length === 0 ? (
              <p className="text-[14px] text-center py-4" style={{ color: '#9aa0ab' }}>記録が貯まると表示されます</p>
            ) : top5.map((t, i) => {
              const rankColors = ['#d4a832', '#9aa0ab', '#b87333'];
              return (
                <div
                  key={t.id}
                  className="grid items-center px-2 py-3 text-[13.5px]"
                  style={{ gridTemplateColumns: '56px 2fr 1fr 1fr 1fr 1fr', color: '#3a4661', borderBottom: '1px solid #f2efe8' }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{
                      background: i < 3 ? rankColors[i] : '#ece9e0',
                      color: i < 3 ? '#fff' : '#6f7a8f',
                    }}
                  >
                    {t.rank}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}
                    >
                      <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(230,201,135,0.4)' }}>restaurant</span>
                    </span>
                    {'id' in t && !t.id.startsWith('m') ? (
                      <Link href={`/venues/${t.id}`} className="font-medium hover:text-gold transition-colors truncate" style={{ color: '#17253f' }}>
                        {t.name}
                      </Link>
                    ) : (
                      <span className="font-medium truncate" style={{ color: '#17253f' }}>{t.name}</span>
                    )}
                  </span>
                  <span>{t.area}</span>
                  <span>{'count' in t ? `${t.count}回` : '—'}</span>
                  <span>{'avgBudget' in t ? t.avgBudget : '—'}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                    {t.avg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mt-5">
        <Link
          href="/record"
          className="flex-1 py-3 rounded-xl text-center font-semibold text-[14px] border"
          style={{ color: '#3a4661', borderColor: '#e2dccf' }}
        >
          会食を記録する
        </Link>
      </div>
    </div>
  );
}
