import Link from 'next/link';
import { db } from '@/lib/db/client';
import { records, venues } from '@/lib/db/schema';
import MapClient from './MapClientWrapper';

function ratingColor(avgRating: number | null): string {
  if (avgRating == null) return '#8a93a4';
  if (avgRating >= 4.2) return '#3d8a5c';
  if (avgRating >= 3.5) return '#c2a15a';
  return '#c0504b';
}

export default async function MapPage() {
  const [allRecords, allVenues] = await Promise.all([
    db.select({ venueId: records.venueId, rating: records.rating }).from(records),
    db.select({
      id: venues.id,
      name: venues.name,
      genre: venues.genre,
      area: venues.area,
      lat: venues.lat,
      lng: venues.lng,
      photoUrl: venues.photoUrl,
    }).from(venues),
  ]);

  const venueCounts: Record<string, number> = {};
  const venueRatings: Record<string, number[]> = {};
  for (const r of allRecords) {
    if (r.venueId) {
      venueCounts[r.venueId] = (venueCounts[r.venueId] ?? 0) + 1;
      if (r.rating != null) (venueRatings[r.venueId] ??= []).push(r.rating);
    }
  }

  // 座標のある店舗をすべてピン表示（会食記録ゼロの店はニュートラル色）
  const pins = allVenues
    .filter((v) => v.lat && v.lng)
    .map((v) => {
      const ratings = venueRatings[v.id] ?? [];
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((s, x) => s + x, 0) / ratings.length) * 10) / 10
        : null;
      return {
        id: v.id,
        name: v.name,
        genre: v.genre,
        area: v.area,
        lat: parseFloat(v.lat!),
        lng: parseFloat(v.lng!),
        count: venueCounts[v.id] ?? 0,
        avgRating,
        photoUrl: v.photoUrl,
      };
    });

  // エリア別におすすめ順（記録多い→評価高い順）で並べる。
  // 地図は東京中心に表示されるため、沖縄など他エリアの店はこの一覧から辿れる。
  const byArea = new Map<string, typeof pins>();
  for (const p of pins) {
    const key = p.area || 'その他';
    if (!byArea.has(key)) byArea.set(key, []);
    byArea.get(key)!.push(p);
  }
  const areaGroups = Array.from(byArea.entries())
    .map(([area, list]) => ({
      area,
      venues: [...list].sort(
        (a, b) => b.count - a.count || (b.avgRating ?? 0) - (a.avgRating ?? 0)
      ),
    }))
    .sort((a, b) => b.venues.length - a.venues.length);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">地図で見る</h1>
          <p className="text-sm text-navy/50 mt-1">登録店舗をピン表示しています（{pins.length}件・ピンの色は評価、★は会食実績あり）</p>
        </div>
      </div>
      <MapClient pins={pins} />

      {/* エリア別おすすめ店（地図の外でも辿れる一覧） */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-navy mb-1">エリア別おすすめ店</h2>
        <p className="text-sm text-navy/50 mb-5">会食記録・評価の高い順に並べています。地図で見つけにくいエリアもこちらから。</p>
        <div className="space-y-7">
          {areaGroups.map(({ area, venues: list }) => (
            <div key={area}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>location_on</span>
                <h3 className="font-serif text-lg font-semibold text-navy">{area}</h3>
                <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: '#eef1f6', color: '#3a4661' }}>{list.length}件</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((v) => (
                  <Link
                    key={v.id}
                    href={`/venues/${v.id}`}
                    className="group flex flex-col bg-white border border-[#eee6d8] rounded-xl overflow-hidden shadow-sm hover:border-gold/50 hover:shadow-md transition-all"
                  >
                    <div className="relative h-32 w-full shrink-0" style={{ background: 'linear-gradient(155deg,#3a2c1c,#1a130c)' }}>
                      {v.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[30px]" style={{ color: 'rgba(230,201,135,0.35)' }}>restaurant</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 w-3 h-3 rounded-full ring-2 ring-white" style={{ background: ratingColor(v.avgRating) }} />
                    </div>
                    <div className="flex flex-col gap-1.5 p-4">
                      <span className="font-serif font-bold text-[15px] leading-snug text-navy group-hover:text-gold-dark transition-colors">{v.name}</span>
                      <div className="text-xs text-navy/60">{v.genre}</div>
                      <div className="flex items-center gap-3 text-xs mt-0.5">
                        <span className="flex items-center gap-1 text-navy/60">
                          <span className="material-symbols-outlined text-[15px]" style={{ color: '#c2a15a' }}>history</span>
                          {v.count > 0 ? `${v.count}回利用` : '記録なし'}
                        </span>
                        {v.avgRating != null && (
                          <span className="flex items-center gap-1 text-navy/70">
                            <span className="material-symbols-outlined text-[15px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                            {v.avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
