import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, isNull } from 'drizzle-orm';
import { venues } from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function tryGeocode(query: string): Promise<{ lat: string; lng: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'settai-navi/1.0 (internal tool)' },
  });
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: data[0].lat, lng: data[0].lon };
}

// 番地レベル → 丁目レベル → 地区レベルの順にフォールバック
async function geocode(address: string): Promise<{ lat: string; lng: string } | null> {
  const attempts = [
    address,
    address.replace(/(\d+)-(\d+)(-\d+)?$/, '$1-$2'), // 末尾の建物番号を削る
    address.replace(/\d+-\d+(-\d+)?$/, ''), // 丁目以降を全て削る
  ];
  for (const q of attempts) {
    const result = await tryGeocode(q);
    if (result) return result;
    await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}

async function main() {
  const missing = await db
    .select({ id: venues.id, name: venues.name, address: venues.address })
    .from(venues)
    .where(isNull(venues.lat));

  console.log(`▶ ${missing.length}件の座標を補完します`);

  for (const v of missing) {
    const coords = await geocode(v.address);
    if (!coords) {
      console.log(`  ✗ 座標取得失敗: ${v.name} (${v.address})`);
      continue;
    }
    await db.update(venues).set({ lat: coords.lat, lng: coords.lng }).where(eq(venues.id, v.id));
    console.log(`  ✓ ${v.name}: ${coords.lat}, ${coords.lng}`);
    // Nominatim の利用規約により1リクエスト/秒に制限
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log('✓ done');
}

main().catch(console.error);
