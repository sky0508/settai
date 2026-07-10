import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { companies, guests, records, venues, users } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { deleteGuest, updateCompanyMemo, updateCompanyAddress, deleteCompany } from './actions';
import DeleteButton from '@/components/ui/DeleteButton';

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, companyId))
    .limit(1);

  if (!company) notFound();

  const guestRows = await db
    .select()
    .from(guests)
    .where(eq(guests.companyId, company.id))
    .orderBy(guests.name);

  // guestId → 最新記録のマップ（N+1回避: inArrayで一括取得）
  const recentByGuest: Record<string, { date: string; rating: number | null }> = {};
  const guestIds = guestRows.map((g) => g.id);
  if (guestIds.length > 0) {
    const allRecentRecords = await db
      .select({ guestId: records.guestId, rating: records.rating, createdAt: records.createdAt })
      .from(records)
      .where(inArray(records.guestId, guestIds))
      .orderBy(desc(records.createdAt));
    for (const r of allRecentRecords) {
      if (r.guestId && !recentByGuest[r.guestId]) {
        recentByGuest[r.guestId] = {
          date: new Date(r.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          rating: r.rating,
        };
      }
    }
  }

  // 社内ナレッジとしての過去すべての会食履歴 (この会社に対する)
  const allCompanyRecords = await db
    .select({
      id: records.id,
      venueName: venues.name,
      venueId: venues.id,
      guestName: guests.name,
      guestTitle: guests.title,
      ownerName: users.name,
      rating: records.rating,
      wentWell: records.wentWell,
      partySize: records.partySize,
      date: records.createdAt,
    })
    .from(records)
    .innerJoin(guests, eq(records.guestId, guests.id))
    .leftJoin(venues, eq(records.venueId, venues.id))
    .leftJoin(users, eq(records.ownerId, users.id))
    .where(eq(guests.companyId, company.id))
    .orderBy(desc(records.createdAt));

  // Bound actions
  const doDeleteCompany = deleteCompany.bind(null, company.id);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(16px,3vw,36px)' }}>
      {/* パンくず */}
      <div className="flex items-center gap-2 mb-5 text-[14px]">
        <Link href="/guests" style={{ color: '#8a93a4' }} className="hover:text-gold">取引先一覧</Link>
        <span className="material-symbols-outlined text-[16px]" style={{ color: '#c3ccd8' }}>chevron_right</span>
        <span className="font-medium" style={{ color: '#3a4661' }}>{company.name}</span>
      </div>

      {/* 会社カード */}
      <div
        className="p-[clamp(20px,2.6vw,30px)]"
        style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 18, boxShadow: '0 8px 24px rgba(20,35,63,0.06)' }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="w-16 h-16 rounded-[15px] flex items-center justify-center shrink-0"
            style={{ background: '#14233f' }}
          >
            <span className="font-serif font-bold text-[28px]" style={{ color: '#e0c07a' }}>{company.initial}</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-serif font-bold text-[clamp(22px,2.8vw,28px)] m-0" style={{ color: '#14233f' }}>
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[12px] rounded px-3 py-0.5" style={{ color: '#7a8296', background: '#f2efe8' }}>
                {company.industry}
              </span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#55617a' }}>
                <span className="material-symbols-outlined text-[17px]" style={{ color: '#c2a15a' }}>local_bar</span>
                取引ビール：{company.drinkAffiliation === 'none' ? '指定なし' : company.drinkAffiliation}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* この会社でお店を探す（本社所在地を動線の拠点にセット） */}
            <Link
              href={`/search?company=${encodeURIComponent(company.name)}${company.address ? `&base=${encodeURIComponent(company.address)}` : ''}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              お店を探す
            </Link>

            {/* 会社削除ボタン */}
            <form action={doDeleteCompany}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] border cursor-pointer transition-colors hover:bg-red-50"
                style={{ background: '#fff', border: '1px solid #e2dccf', color: '#c0504b' }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                取引先を削除
              </button>
            </form>
          </div>
        </div>

        {/* 本社所在地（お店検索の拠点に使う） */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[19px]" style={{ color: '#c2a15a' }}>location_on</span>
            <span className="text-[14px] font-bold" style={{ color: '#3a4661' }}>本社所在地</span>
            <span className="text-[11px]" style={{ color: '#9aa0ab' }}>（お店探しの動線の拠点に使われます）</span>
          </div>
          <form
            action={async (formData: FormData) => {
              'use server';
              const address = formData.get('address') as string;
              await updateCompanyAddress(company.id, address, company.slug);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              name="address"
              defaultValue={company.address ?? ''}
              placeholder="例: 東京都中野区中野4-10-2"
              className="flex-1 text-[14px] outline-none"
              style={{ border: '1.5px solid #ece2cb', borderRadius: 12, padding: '10px 14px', color: '#3a4661', background: '#fdfaf2' }}
            />
            <button
              type="submit"
              className="self-start flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold cursor-pointer shrink-0"
              style={{ background: '#14233f', color: '#fff' }}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              住所を保存
            </button>
          </form>
        </div>

        {/* メモ編集フォーム */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[19px]" style={{ color: '#c2a15a' }}>sticky_note_2</span>
            <span className="text-[14px] font-bold" style={{ color: '#3a4661' }}>会社メモ</span>
          </div>
          <form
            action={async (formData: FormData) => {
              'use server';
              const memo = formData.get('memo') as string;
              await updateCompanyMemo(company.id, memo, company.slug);
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              name="memo"
              defaultValue={company.memo ?? ''}
              className="w-full resize-y text-[14px] leading-relaxed outline-none"
              rows={3}
              style={{
                minHeight: 82,
                border: '1.5px solid #ece2cb',
                borderRadius: 12,
                padding: '14px 16px',
                color: '#3a4661',
                background: '#fdfaf2',
              }}
            />
            <button
              type="submit"
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold cursor-pointer"
              style={{ background: '#14233f', color: '#fff' }}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              メモを保存
            </button>
          </form>
        </div>
      </div>

      {/* 担当者リスト */}
      <div className="flex items-center gap-2 mt-7 mb-3.5 flex-wrap">
        <span className="material-symbols-outlined text-[22px]" style={{ color: '#14233f' }}>group</span>
        <h2 className="font-serif font-bold text-[20px] m-0" style={{ color: '#17253f' }}>担当者</h2>
        <span
          className="text-[12.5px] font-medium rounded-full px-3 py-0.5"
          style={{ color: '#8a93a4', background: '#efe9dd' }}
        >
          {guestRows.length}名
        </span>
        <Link
          href={`/guests/${companyId}/new`}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold border"
          style={{ background: '#fff', border: '1px solid #d8bd78', color: '#a37f2b' }}
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          担当者を追加
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {guestRows.map((g) => {
          const recent = recentByGuest[g.id];
          const doDeleteGuest = deleteGuest.bind(null, g.id, companyId);
          return (
            <div
              key={g.id}
              className="flex items-center gap-4 flex-wrap"
              style={{
                background: '#fff',
                border: '1px solid #eee6d8',
                borderRadius: 14,
                boxShadow: '0 5px 15px rgba(20,35,63,0.04)',
                padding: '14px 18px',
              }}
            >
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#eef1f6' }}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ color: '#8a97ac' }}>person</span>
              </div>
              <Link href={`/guests/${companyId}/${g.id}`} className="flex-1 min-w-[180px] block group">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[12.5px] font-medium" style={{ color: '#8a6a1f' }}>{g.title}</span>
                  <span className="font-serif font-bold text-[18px] group-hover:text-gold transition-colors" style={{ color: '#17253f' }}>{g.name}</span>
                  <span className="text-[12.5px]" style={{ color: '#7a8296' }}>様</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(g.preferences as string[]).map((t) => (
                    <span key={t} className="text-[12px] rounded-lg px-2.5 py-1"
                      style={{ border: '1px solid #e0d5b3', color: '#8a6a1f', background: '#fbf6ea' }}>{t}</span>
                  ))}
                  {(g.ngFoods as string[]).map((ng) => (
                    <span key={ng} className="text-[12px] rounded-lg px-2.5 py-1"
                      style={{ border: '1px solid #e6b3b3', color: '#c0504b', background: '#fdf1f1' }}>
                      NG：{ng}
                    </span>
                  ))}
                </div>
              </Link>
              <div className="flex items-center gap-3 ml-auto">
                <div className="text-right">
                  <div className="text-[11px]" style={{ color: '#9aa0ab' }}>直近の会食</div>
                  <div className="text-[12.5px] flex items-center gap-1.5 justify-end mt-0.5" style={{ color: '#55617a' }}>
                    {recent?.date ?? '—'}
                    {recent?.rating != null && (
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[15px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <b style={{ color: '#14233f' }}>{recent.rating}</b>
                      </span>
                    )}
                  </div>
                </div>
                {/* 担当者削除ボタン */}
                <form action={doDeleteGuest}>
                  <DeleteButton
                    className="text-navy/30 hover:text-ng transition-colors cursor-pointer"
                    aria-label="担当者を削除"
                    message={`「${g.name}」を削除してもよろしいですか？\nこの操作は元に戻せません。`}
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </DeleteButton>
                </form>
                <Link href={`/guests/${companyId}/${g.id}`}>
                  <span className="material-symbols-outlined text-[22px] hover:text-gold transition-colors" style={{ color: '#c3ccd8' }}>
                    chevron_right
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 社内ナレッジ（過去のすべての記録） */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[22px]" style={{ color: '#c2a15a' }}>history</span>
          <h2 className="font-serif font-bold text-[20px] m-0" style={{ color: '#17253f' }}>社内ナレッジ（過去の利用店舗）</h2>
        </div>
        {allCompanyRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-navy/50 bg-white rounded-xl border border-navy/10">
            まだ社内共有された記録がありません。
          </div>
        ) : (
          <div className="grid gap-4">
            {allCompanyRecords.map(r => (
              <div key={r.id} className="p-5 bg-white border border-[#eee6d8] rounded-xl shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-bold text-[15px] opacity-70 border bg-slate-50 px-2 py-0.5 rounded shadow-sm">
                      {new Date(r.date).toLocaleDateString('ja-JP')}
                    </div>
                    {r.rating != null && (
                      <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                        <span className="material-symbols-outlined text-[15px] text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <b className="text-yellow-700">{r.rating}</b>
                      </div>
                    )}
                  </div>
                  <Link href={`/venues/${r.venueId}`} className="block font-serif text-[18px] font-bold text-navy hover:text-gold mb-1">
                    {r.venueName ?? '不明な店舗'}
                  </Link>
                  <p className="text-sm text-navy/80 mb-3">{r.wentWell}</p>
                </div>
                <div className="text-sm text-navy/70 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[240px]">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold">参加ゲスト:</span>
                    <span>{r.guestName} 様 ({r.guestTitle})</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold">当方参加者:</span>
                    <span className="font-medium text-navy">{r.ownerName ?? '名称未設定'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="font-semibold">会食人数:</span>
                    <span>{r.partySize ? `${r.partySize}名` : '不明'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
