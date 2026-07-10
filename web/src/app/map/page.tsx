import { db } from '@/lib/db/client';
import { records, venues } from '@/lib/db/schema';
import MapClient from './MapClientWrapper';

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

  // 座標のある店舗をすべてピン表示（接待記録ゼロの店はニュートラル色）
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
      };
    });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">地図で見る</h1>
          <p className="text-sm text-navy/50 mt-1">登録店舗をピン表示しています（{pins.length}件・色は接待記録の平均評価、数字は利用回数）</p>
        </div>
      </div>
      <MapClient pins={pins} />
    </div>
  );
}
