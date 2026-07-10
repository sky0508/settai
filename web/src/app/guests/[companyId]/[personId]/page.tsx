import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/client';
import { companies, guests, records, venues } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { deleteGuest } from '../actions';
import DeleteButton from '@/components/ui/DeleteButton';

export default async function PersonPage({
  params,
}: {
  params: Promise<{ companyId: string; personId: string }>;
}) {
  const { companyId, personId } = await params;

  // 会社をslugで引く
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, companyId))
    .limit(1);
  if (!company) notFound();

  // ゲストをUUID or nameで引く（後方互換: p1〜p8 形式は無視してUUIDで探す）
  const [person] = await db
    .select()
    .from(guests)
    .where(eq(guests.id, personId))
    .limit(1);
  if (!person || person.companyId !== company.id) notFound();

  // 会食記録
  const historyRows = await db
    .select({
      id: records.id,
      venueId: records.venueId,
      rating: records.rating,
      wentWell: records.wentWell,
      reflection: records.reflection,
      businessOutcome: records.businessOutcome,
      createdAt: records.createdAt,
    })
    .from(records)
    .where(eq(records.guestId, person.id))
    .orderBy(desc(records.createdAt))
    .limit(10);

  // venue名を一括取得（N+1回避）
  const venueIds = [...new Set(historyRows.map((r) => r.venueId).filter(Boolean))] as string[];
  const venueRows = venueIds.length > 0
    ? await db.select({ id: venues.id, name: venues.name }).from(venues).where(inArray(venues.id, venueIds))
    : [];
  const venueMap: Record<string, string> = Object.fromEntries(venueRows.map((v) => [v.id, v.name]));

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eee6d8',
    borderRadius: 18,
    boxShadow: '0 8px 24px rgba(20,35,63,0.06)',
  } as const;

  const prefs = person.preferences as string[];
  const ngs = person.ngFoods as string[];
  const doDeleteGuest = deleteGuest.bind(null, person.id, companyId);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(16px,3vw,36px)' }}>
      {/* パンくず */}
      <div className="flex items-center gap-2 mb-5 flex-wrap text-[14px]">
        <Link href="/guests" style={{ color: '#8a93a4' }} className="hover:text-gold">取引先一覧</Link>
        <span className="material-symbols-outlined text-[16px]" style={{ color: '#c3ccd8' }}>chevron_right</span>
        <Link href={`/guests/${companyId}`} style={{ color: '#8a93a4' }} className="hover:text-gold">{company.name}</Link>
        <span className="material-symbols-outlined text-[16px]" style={{ color: '#c3ccd8' }}>chevron_right</span>
        <span className="font-medium" style={{ color: '#3a4661' }}>担当者カルテ</span>
        <form action={doDeleteGuest} className="ml-auto">
          <DeleteButton
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] border cursor-pointer transition-colors hover:bg-red-50"
            style={{ background: '#fff', border: '1px solid #e2dccf', color: '#c0504b' }}
            message={`「${person.name}」を削除してもよろしいですか？\nこの操作は元に戻せません。`}
          >
            <span className="material-symbols-outlined text-[17px]">delete</span>
            担当者を削除
          </DeleteButton>
        </form>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', alignItems: 'start' }}>
        {/* 左カラム：プロフィール */}
        <div className="p-[clamp(20px,2.5vw,30px)]" style={cardStyle}>
          <div className="flex items-center gap-5 flex-wrap">
            <div
              className="w-[104px] h-[104px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#e9edf3' }}
            >
              <span className="material-symbols-outlined text-[52px]" style={{ color: '#8a97ac' }}>person</span>
            </div>
            <div>
              <div>
                <span className="font-serif font-bold text-[clamp(22px,2.6vw,27px)]" style={{ color: '#14233f' }}>
                  {person.title} {person.name}
                </span>
                <span className="text-[15px] ml-1.5" style={{ color: '#7a8296' }}>様</span>
              </div>
              <div className="text-[15px] mt-1.5" style={{ color: '#7a8296' }}>{company.name}</div>
            </div>
          </div>

          <div className="h-px my-5" style={{ background: '#ece6da' }} />

          {/* 好み */}
          <div className="flex items-start gap-3.5 mb-4">
            <span className="material-symbols-outlined text-[22px] mt-0.5" style={{ color: '#c2a15a' }}>favorite</span>
            <span className="w-11 text-[14px] font-bold shrink-0 mt-0.5" style={{ color: '#3a4661' }}>好み</span>
            <div className="flex flex-wrap gap-2">
              {prefs.length === 0
                ? <span className="text-[13px]" style={{ color: '#9aa0ab' }}>未登録</span>
                : prefs.map((p) => (
                  <span key={p} className="rounded-lg px-3 py-1.5 text-[13.5px]"
                    style={{ border: '1px solid #d8bd78', color: '#8a6a1f', background: '#fbf6ea' }}>
                    {p}
                  </span>
                ))
              }
            </div>
          </div>

          {/* NG */}
          {ngs.length > 0 && (
            <div className="flex items-center gap-3.5 mb-4">
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#c98a8a' }}>cancel</span>
              <span className="w-11 text-[14px] font-bold shrink-0" style={{ color: '#3a4661' }}>NG</span>
              <span className="rounded-lg px-3 py-1.5 text-[13.5px]"
                style={{ border: '1px solid #e0a3a3', color: '#c0504b', background: '#fdf1f1' }}>
                {ngs.join('・')}
              </span>
            </div>
          )}

          {/* メモ */}
          {person.memo && (
            <div className="mb-4 p-4 rounded-xl text-[13.5px] leading-relaxed" style={{ background: '#faf3e2', border: '1px solid #eddfba', color: '#8a6a1f' }}>
              {person.memo}
            </div>
          )}

          <div className="h-px my-4" style={{ background: '#ece6da' }} />

          {/* 予算・頻度 */}
          <div className="flex items-center gap-3.5 mb-4">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#98a2b3' }}>account_balance_wallet</span>
            <span className="w-20 text-[14px] font-bold shrink-0" style={{ color: '#3a4661' }}>予算目安</span>
            <span className="text-[14.5px]" style={{ color: '#3a4661' }}>
              {person.budgetMin != null && person.budgetMax != null
                ? `${person.budgetMin.toLocaleString()}〜${person.budgetMax.toLocaleString()}円`
                : '未登録'}
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#98a2b3' }}>calendar_month</span>
            <span className="w-20 text-[14px] font-bold shrink-0" style={{ color: '#3a4661' }}>会食頻度</span>
            <span className="text-[14.5px]" style={{ color: '#3a4661' }}>{person.freq ?? '未登録'}</span>
          </div>

          {/* CTA */}
          <Link
            href={`/search?company=${encodeURIComponent(company.name)}&role=${encodeURIComponent(person.title)}&guestId=${person.id}`}
            className="w-full mt-7 flex items-center justify-center gap-2 py-4 rounded-[13px] text-white font-bold text-[15.5px]"
            style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 8px 20px rgba(184,148,74,0.3)' }}
          >
            <span className="material-symbols-outlined text-[21px]">search</span>
            このゲストに合う店を探す
          </Link>
        </div>

        {/* 右カラム：会食履歴 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#14233f' }}>history</span>
            <h2 className="font-serif font-bold text-[20px] m-0" style={{ color: '#17253f' }}>会食履歴</h2>
          </div>

          <div className="flex flex-col gap-3.5">
            {historyRows.length === 0 ? (
              <div
                className="p-8 text-center text-[14px]"
                style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 14, color: '#9aa0ab' }}
              >
                まだ記録がありません
              </div>
            ) : (
              historyRows.map((h) => {
                const d = new Date(h.createdAt);
                const venueName = h.venueId ? venueMap[h.venueId] ?? '—' : '—';
                return (
                  <div
                    key={h.id}
                    className="p-4"
                    style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 14, boxShadow: '0 5px 15px rgba(20,35,63,0.04)' }}
                  >
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="text-center shrink-0">
                        <div className="text-[12px]" style={{ color: '#8a93a4' }}>{d.getFullYear()}</div>
                        <div className="font-serif font-bold text-[17px]" style={{ color: '#14233f' }}>{d.getMonth() + 1}月</div>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="font-serif font-bold text-[18px]" style={{ color: '#17253f' }}>{venueName}</div>
                      </div>
                      {h.rating != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[20px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                          <b className="text-[17px]" style={{ color: '#14233f' }}>{h.rating}</b>
                        </div>
                      )}
                    </div>
                    {h.wentWell && (
                      <div className="flex items-center gap-1.5 mt-3 text-[13px]" style={{ color: '#5a6c8a' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: '#c2a15a' }}>thumb_up</span>
                        <b style={{ color: '#8a6a1f' }}>良かった点：</b>{h.wentWell}
                      </div>
                    )}
                    {h.reflection && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[13px]" style={{ color: '#7a8296' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: '#98a2b3' }}>edit</span>
                        反省メモ：{h.reflection}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <Link
              href={`/record?guestId=${person.id}`}
              className="flex items-center justify-center gap-2 py-4 rounded-[14px] font-bold text-[14.5px] cursor-pointer"
              style={{ border: '1.5px dashed #d8bd78', color: '#a37f2b', background: '#fdfaf2' }}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              会食履歴を追加
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
