import { db } from '@/lib/db/client';
import { venues, favorites, records, guests, users, companies } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { ScoreDonut } from '@/components/ui/ScoreDonut';
import { toggleFavorite, deleteVenue } from '../actions';
import { attachVenueToReservation } from '@/app/reservations/actions';
import DeleteButton from '@/components/ui/DeleteButton';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import Link from 'next/link';

function ScoreBar({ label, val }: { label: string; val: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 text-navy/60 text-xs shrink-0">{label}</span>
      <div className="flex-1 bg-navy/10 rounded-full h-2">
        <div
          className="bg-gold h-2 rounded-full transition-all"
          style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-navy/50">{val}</span>
    </div>
  );
}

export default async function VenueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ score?: string; badge?: string; bars?: string; reservationId?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const reservationId = sp.reservationId;

  const rows = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const v = rows[0];

  const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
  const favRows = adminUser
    ? await db.select().from(favorites).where(and(eq(favorites.venueId, id), eq(favorites.userId, adminUser.id))).limit(1)
    : [];
  const isFavorite = favRows.length > 0;

  // この店舗に対する過去の会食記録 (社内ナレッジ)
  const venueRecords = await db
    .select({
      id: records.id,
      guestName: guests.name,
      guestTitle: guests.title,
      companyName: companies.name,
      companySlug: companies.slug,
      ownerName: users.name,
      rating: records.rating,
      wentWell: records.wentWell,
      partySize: records.partySize,
      date: records.createdAt,
    })
    .from(records)
    .innerJoin(guests, eq(records.guestId, guests.id))
    .innerJoin(companies, eq(guests.companyId, companies.id))
    .leftJoin(users, eq(records.ownerId, users.id))
    .where(eq(records.venueId, id))
    .orderBy(desc(records.createdAt));

  // 検索結果から渡されたスコア情報
  const score = sp.score ? Number(sp.score) : null;
  const badge = (sp.badge as 'OK' | '注意' | 'NG') || null;
  const defaultBars = [
    { label: '格式', val: v.formalityGrade === 'S' ? 90 : v.formalityGrade === 'A' ? 65 : 35 },
    { label: '予算', val: 60 },
    { label: '個室', val: v.privateRoomType === '完全個室' ? 90 : v.privateRoomType === '半個室' ? 60 : 20 },
    { label: '確信度', val: v.beerConfidence === 'confirmed' ? 90 : v.beerConfidence === 'estimated' ? 50 : 20 },
  ];
  let bars: { label: string; val: number }[];
  try {
    bars = sp.bars ? JSON.parse(decodeURIComponent(sp.bars)) : defaultBars;
  } catch {
    bars = defaultBars;
  }

  const displayBadge: 'OK' | '注意' | 'NG' = badge ?? 'OK';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* パンくず */}
      <nav className="text-xs text-navy/50 mb-4">
        <Link href="/search" className="hover:text-gold">お店を探す</Link>
        <span className="mx-1">›</span>
        <span>{v.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左カラム */}
        <div className="space-y-4">
          {/* 写真カルーセル（最大3枚・スワイプ） */}
          {(() => {
            const gallery = v.photos && v.photos.length > 0 ? v.photos : v.photoUrl ? [v.photoUrl] : [];
            if (gallery.length === 0) {
              return (
                <div className="bg-navy/10 rounded-xl h-52 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-navy/30 text-5xl">restaurant</span>
                </div>
              );
            }
            return <PhotoCarousel photos={gallery} name={v.name} />;
          })()}

          {/* スコア内訳 4軸バー */}
          {score !== null && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ScoreDonut score={score} badge={displayBadge} size={52} />
                <div>
                  <div className="text-xs text-navy/50 mb-0.5">適合スコア</div>
                  <Badge type={displayBadge} />
                </div>
              </div>
              <div className="space-y-2">
                {bars.map((b) => <ScoreBar key={b.label} {...b} />)}
              </div>
            </div>
          )}

          {/* スコアなしで直アクセスした場合のプロフィールバー */}
          {score === null && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-navy/60 mb-3">店舗プロフィール</h3>
              <div className="space-y-2">
                {bars.map((b) => <ScoreBar key={b.label} {...b} />)}
              </div>
            </div>
          )}

          {/* 地図 */}
          {v.address && (
            process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&q=${encodeURIComponent(v.address)}&language=ja&zoom=16`}
                  className="w-full border-0"
                  style={{ height: 200 }}
                  loading="lazy"
                  title="地図"
                />
              </div>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white rounded-xl p-4 shadow-sm text-sm font-medium text-navy/70 hover:text-gold transition-colors"
                style={{ height: 200 }}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ color: '#c2a15a' }}>map</span>
                Google マップで地図を見る
              </a>
            )
          )}

          {/* 競合ドリンク確認 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-navy/60 mb-2">競合ドリンク確認</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.beerAffiliation === 'unknown' ? 'bg-navy/10 text-navy/50'
                : 'bg-gold/10 text-gold-dark'
                }`}>
                {v.beerAffiliation === 'unknown' ? '系統不明' : v.beerAffiliation}
              </span>
              <span className="text-xs text-navy/50">確信度: {v.beerConfidence}</span>
            </div>
            {(v.beerAffiliation === 'unknown' || v.beerConfidence === 'unknown') && (
              <p className="text-xs text-caution mt-2">⚠ 予約時にビール銘柄をご確認ください</p>
            )}
          </div>

          {/* おすすめ理由 */}
          {v.curationNote && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-navy/60 mb-2">おすすめの理由</h3>
              <p className="text-sm text-navy/80 leading-relaxed">{v.curationNote}</p>
            </div>
          )}
        </div>

        {/* 右カラム */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl font-semibold text-navy leading-snug">{v.name}</h1>
              <p className="text-sm text-navy/60 mt-1">{v.genre} · {v.area}</p>
              <p className="text-sm text-navy/60">
                {v.budgetMin.toLocaleString()}〜{v.budgetMax.toLocaleString()}円/人
              </p>
            </div>
            <form action={toggleFavorite.bind(null, v.id)} className="shrink-0">
              <button
                type="submit"
                className="w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center border border-navy/10 cursor-pointer bg-white"
                style={{ color: isFavorite ? '#c2a15a' : '#8a93a4' }}
                title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : undefined }}>
                  star
                </span>
              </button>
            </form>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold text-gold border border-gold/40 rounded px-1.5 py-0.5">
              格式{v.formalityGrade}
            </span>
          </div>

          {/* 情報行 */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2.5">
            {[
              { icon: 'meeting_room', text: `${v.privateRoomType}` + (v.privateRoomNote ? ` · ${v.privateRoomNote}` : '') },
              { icon: 'train', text: `${v.nearestStation}駅 徒歩${v.walkMinutes}分` },
              { icon: 'event_available', text: v.requiresReservation ? '要予約' : '予約なし可' },
              ...(v.phone ? [{ icon: 'call', text: v.phone }] : []),
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-2 text-sm text-navy/70">
                <span className="material-symbols-outlined text-[18px] text-gold shrink-0 mt-0.5">{icon}</span>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
            {v.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-navy/70 hover:text-gold transition-colors group"
              >
                <span className="material-symbols-outlined text-[18px] text-gold shrink-0 mt-0.5">location_on</span>
                <span className="leading-snug group-hover:underline">{v.address}</span>
              </a>
            )}
          </div>

          {/* タグ */}
          {v.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {v.tags.map((t) => (
                <span key={t} className="text-xs bg-navy/8 text-navy/70 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          {reservationId ? (
            // 確定済み会食から来た場合: 既存の予定にこの店を紐づける（再入力なし）
            <form action={attachVenueToReservation.bind(null, reservationId, v.id)}>
              <button
                type="submit"
                className="block w-full py-3 rounded-xl text-center text-white font-semibold text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)', boxShadow: '0 4px 12px rgba(184,148,74,0.25)' }}
              >
                この会食の店に決定する
              </button>
            </form>
          ) : (
            <Link
              href={`/reservations/new?venueId=${v.id}`}
              className="block w-full py-3 rounded-xl text-center text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)', boxShadow: '0 4px 12px rgba(184,148,74,0.25)' }}
            >
              このお店で会食を予定する
            </Link>
          )}

          <Link
            href={`/record?venueId=${v.id}`}
            className="block w-full py-2.5 rounded-xl text-center text-navy font-semibold text-sm bg-navy/5 hover:bg-navy/10 transition-colors"
          >
            過去の会食記録をつける
          </Link>

          <Link
            href={`/venues/${v.id}/edit`}
            className="block w-full py-2.5 rounded-xl text-center text-navy text-sm border border-navy/20 hover:bg-navy/5 transition-colors font-medium"
          >
            店舗情報を編集する
          </Link>

          <form action={deleteVenue.bind(null, v.id)}>
            <DeleteButton
              className="w-full py-2.5 rounded-xl text-center text-red-500 text-sm border border-red-200 hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              message={`「${v.name}」を削除してもよろしいですか？\nこの操作は元に戻せません。`}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              この店舗を削除する
            </DeleteButton>
          </form>

          {v.websiteUrl && (
            <a
              href={v.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-xl text-center text-navy text-sm border border-navy/20 hover:bg-navy/5 transition-colors"
            >
              公式サイトを見る
            </a>
          )}
        </div>
      </div>

      {/* 社内ナレッジ（過去のすべての記録） */}
      <div className="mt-8 mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[22px]" style={{ color: '#c2a15a' }}>history</span>
          <h2 className="font-serif font-bold text-[20px] m-0" style={{ color: '#17253f' }}>過去の利用履歴（社内ナレッジ）</h2>
        </div>
        {venueRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-navy/50 bg-white rounded-xl border border-navy/10">
            まだこの店舗での会食記録はありません。
          </div>
        ) : (
          <div className="grid gap-4">
            {venueRecords.map(r => (
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
                  <Link href={`/guests/${r.companySlug}`} className="block font-serif text-[16px] font-bold text-navy hover:text-gold mb-1">
                    {r.companyName}
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
