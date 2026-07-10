import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, isNull } from 'drizzle-orm';
import { venues } from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function tryGeocode(query: string): Promise<{ lat: string; lng: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'settai-navi/1.0 (internal tool)' } });
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: data[0].lat, lng: data[0].lon };
}

// ビル名・階・スペース以降を落として住所コア（丁目・番地まで）だけにする
function cleanAddress(address: string): string[] {
  const noBuilding = address.split(/[\s　]/)[0]; // 最初の空白より前 = 建物名前まで
  const attempts = new Set<string>([
    noBuilding,
    noBuilding.replace(/(\d+-\d+)-\d+$/, '$1'), // 末尾の号を落とす
    noBuilding.replace(/-\d+(-\d+)?$/, ''),      // 丁目のみ
    noBuilding.replace(/\d+-\d+(-\d+)?$/, ''),   // 番地を全て落とす（地区レベル）
    noBuilding.replace(/字[^0-9]*\d+.*$/, ''),   // 「字○○156-2」形式 → 市まで
  ]);
  return [...attempts].filter((a) => a && a.length > 6);
}

async function main() {
  const missing = await db
    .select({ id: venues.id, name: venues.name, address: venues.address })
    .from(venues)
    .where(isNull(venues.lat));

  console.log(`▶ ${missing.length}件を再ジオコーディング`);

  for (const v of missing) {
    let hit: { lat: string; lng: string } | null = null;
    for (const q of cleanAddress(v.address)) {
      hit = await tryGeocode(q);
      await new Promise((r) => setTimeout(r, 1100));
      if (hit) break;
    }
    if (!hit) {
      console.log(`  ✗ 失敗: ${v.name} (${v.address})`);
      continue;
    }
    await db.update(venues).set({ lat: hit.lat, lng: hit.lng }).where(eq(venues.id, v.id));
    console.log(`  ✓ ${v.name}: ${hit.lat}, ${hit.lng}`);
  }
  console.log('✓ done');
}

main().catch(console.error);
