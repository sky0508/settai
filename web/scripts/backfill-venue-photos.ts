import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql as dsql } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { venues } from '../src/lib/db/schema';

/**
 * Google Places (New) から各店の代表写真を取得して Cloudinary にアップロードし、
 * venues.photoUrl を更新する。座標(lat/lng)が空の店は Places の location で併せて補完する。
 *
 * 必要 env（すべて .env）:
 *   DATABASE_URL           … Neon（★ローテ後の資格情報）
 *   GOOGLE_PLACES_API_KEY  … Places API (New) 有効・課金紐付け済み
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 *
 * 使い方: npx tsx scripts/backfill-venue-photos.ts [--dry-run]
 * 冪等: photoUrl が既にある店はスキップ。
 */

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.photos',
  'places.location',
  'places.rating',
  'places.userRatingCount',
].join(',');

const AREA_TOKENS = ['銀座', '京橋', '日本橋', '八重洲', '丸の内', '有楽町', '沖縄', '那覇', '名護'];
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_OKINAWA = process.argv.includes('--okinawa'); // 沖縄の店だけに絞る

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey && !DRY_RUN) {
  console.error('ERROR: GOOGLE_PLACES_API_KEY が未設定です（.env）');
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME && !DRY_RUN) {
  console.error('ERROR: CLOUDINARY_CLOUD_NAME 他 Cloudinary の env が未設定です（.env）');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type Place = {
  id?: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  photos?: { name: string }[];
  rating?: number;
  userRatingCount?: number;
};

async function textSearch(query: string): Promise<Place | null> {
  const resp = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey!,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'ja',
      regionCode: 'JP',
      maxResultCount: 1,
    }),
  });
  if (!resp.ok) {
    console.log(`    ! search HTTP ${resp.status}: ${(await resp.text()).slice(0, 160)}`);
    return null;
  }
  const data = (await resp.json()) as { places?: Place[] };
  return data.places?.[0] ?? null;
}

async function uploadPhotoToCloudinary(photoName: string, publicId: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${apiKey}`;
  const resp = await fetch(url, { headers: { Accept: 'image/*' }, redirect: 'follow' });
  if (!resp.ok || !(resp.headers.get('content-type') ?? '').includes('image')) {
    console.log(`    ! photo HTTP ${resp.status} / ${resp.headers.get('content-type')}`);
    return null;
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  return await new Promise<string | null>((resolve) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'settai', public_id: publicId, overwrite: true, resource_type: 'image' },
        (err, res) => resolve(err || !res ? null : res.secure_url),
      )
      .end(buffer);
  });
}

async function main() {
  const targets = await db
    .select({
      id: venues.id,
      slug: venues.slug,
      name: venues.name,
      address: venues.address,
      area: venues.area,
      lat: venues.lat,
      photoUrl: venues.photoUrl,
    })
    .from(venues)
    .where(
      ONLY_OKINAWA
        ? dsql`coalesce(jsonb_array_length(${venues.photos}), 0) < 3 and ${venues.address} like '沖縄県%'`
        : dsql`coalesce(jsonb_array_length(${venues.photos}), 0) < 3`,
    );

  console.log(`▶ ${targets.length}件の写真（各最大3枚）を Places → Cloudinary で補完します${ONLY_OKINAWA ? '【沖縄限定】' : ''}${DRY_RUN ? '（dry-run）' : ''}`);

  let saved = 0;
  const misses: { slug: string; why: string }[] = [];
  const addressMismatches: { slug: string; seed: string; places: string }[] = [];

  for (const v of targets) {
    const query = `${v.name} ${v.address}`.trim();
    console.log(`[search] ${v.slug} :: ${query}`);
    if (DRY_RUN) continue;

    const place = await textSearch(query);
    if (!place) {
      misses.push({ slug: v.slug, why: 'no-place' });
      await sleep(300);
      continue;
    }

    // 住所の妥当性チェック（別店ヒットの取りこぼし検出・安全側運用）
    const placesAddr = place.formattedAddress ?? '';
    const areaOk = AREA_TOKENS.some((t) => placesAddr.includes(t) && v.address.includes(t));
    if (!areaOk) {
      addressMismatches.push({ slug: v.slug, seed: v.address, places: placesAddr });
    }

    // 座標が空なら Places の location で補完（Nominatim backfill を上書きしない：null の時だけ）
    const coordUpdate: { lat?: string; lng?: string } = {};
    if (v.lat == null && place.location) {
      coordUpdate.lat = String(place.location.latitude);
      coordUpdate.lng = String(place.location.longitude);
    }

    const photoNames = (place.photos ?? []).slice(0, 3).map((p) => p.name).filter(Boolean);
    if (photoNames.length === 0) {
      // 写真は無いが座標は入れておく
      if (coordUpdate.lat) await db.update(venues).set(coordUpdate).where(eq(venues.id, v.id));
      misses.push({ slug: v.slug, why: 'no-photo' });
      console.log('    - place はあるが写真なし');
      await sleep(300);
      continue;
    }

    // 最大3枚を Cloudinary に（public_id = <slug>-0/1/2）
    const urls: string[] = [];
    for (let i = 0; i < photoNames.length; i++) {
      const u = await uploadPhotoToCloudinary(photoNames[i], `${v.slug}-${i}`);
      if (u) urls.push(u);
    }
    if (urls.length === 0) {
      if (coordUpdate.lat) await db.update(venues).set(coordUpdate).where(eq(venues.id, v.id));
      misses.push({ slug: v.slug, why: 'upload-failed' });
      await sleep(300);
      continue;
    }

    await db
      .update(venues)
      .set({ photos: urls, photoUrl: urls[0], ...coordUpdate, updatedAt: new Date() })
      .where(eq(venues.id, v.id));
    saved++;
    console.log(`    ✓ ${v.slug} → ${urls.length}枚`);
    await sleep(300);
  }

  console.log('\n===== サマリー =====');
  console.log(`対象: ${targets.length} / 写真保存: ${saved}`);
  if (misses.length) {
    console.log('取得できなかった店（photoUrl は null のまま・手当て要）:');
    for (const m of misses) console.log(`  - ${m.slug}: ${m.why}`);
  }
  if (addressMismatches.length) {
    console.log('\n⚠️ 住所不一致（別店ヒットの可能性・要目視確認）:');
    for (const m of addressMismatches) console.log(`  - ${m.slug}\n      seed:   ${m.seed}\n      places: ${m.places}`);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
