import 'dotenv/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env.local を明示ロード
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { companies, guests } from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SEED_COMPANIES = [
  {
    slug: 'kirin',
    name: 'キリンビール株式会社',
    industry: '飲料メーカー',
    initial: 'キ',
    drinkAffiliation: 'kirin',
    memo: 'キリン系列店を優先。アサヒ・サントリー系は NG。',
    guests: [
      { name: '田中 一郎', title: '部長',  preferences: ['日本酒', '和食', '個室'], ngFoods: [],        memo: '落ち着いた雰囲気を好む。話題はゴルフと家族。', budgetMin: 15000, budgetMax: 20000, freq: '月1〜2回' },
      { name: '鈴木 花子', title: '課長',  preferences: ['フレンチ', 'ワイン'],      ngFoods: ['甲殻類'], memo: '甲殻類アレルギーに注意。',                   budgetMin: 10000, budgetMax: 15000, freq: '月1回' },
    ],
  },
  {
    slug: 'asahi',
    name: 'アサヒグループホールディングス',
    industry: '飲料メーカー',
    initial: 'ア',
    drinkAffiliation: 'asahi',
    memo: 'アサヒ系列店を優先。',
    guests: [
      { name: '山本 太郎', title: '役員',  preferences: ['鉄板焼き', '個室'], ngFoods: [], memo: '役員クラスのため格式Sが望ましい。', budgetMin: 20000, budgetMax: 30000, freq: '四半期1回' },
    ],
  },
  {
    slug: 'suntory',
    name: 'サントリーホールディングス',
    industry: '飲料メーカー',
    initial: 'サ',
    drinkAffiliation: 'suntory',
    memo: 'サントリー系列店を優先。',
    guests: [
      { name: '佐藤 二郎', title: '部長', preferences: ['和食'],      ngFoods: [], memo: null,           budgetMin: 10000, budgetMax: 20000, freq: '月1回' },
      { name: '伊藤 三郎', title: '課長', preferences: [],            ngFoods: [], memo: null,           budgetMin: 8000,  budgetMax: 15000, freq: '不定期' },
      { name: '高橋 四郎', title: '担当', preferences: [],            ngFoods: [], memo: null,           budgetMin: 8000,  budgetMax: 12000, freq: '不定期' },
    ],
  },
  {
    slug: 'example',
    name: '株式会社サンプル商事',
    industry: '商社',
    initial: '商',
    drinkAffiliation: 'none',
    memo: 'ビール系列の制約なし。',
    guests: [
      { name: '渡辺 五郎', title: '部長', preferences: ['寿司'],      ngFoods: [], memo: null,           budgetMin: 10000, budgetMax: 20000, freq: '月1〜2回' },
      { name: '小林 六子', title: '課長', preferences: ['イタリアン'], ngFoods: [], memo: null,           budgetMin: 8000,  budgetMax: 15000, freq: '月1回' },
    ],
  },
];

async function seed() {
  console.log('▶ seeding companies & guests...');

  for (const c of SEED_COMPANIES) {
    const existing = await db.select().from(companies).where(eq(companies.slug, c.slug)).limit(1);
    let companyId: string;

    if (existing.length > 0) {
      companyId = existing[0].id;
      console.log(`  skip company: ${c.slug} (id: ${companyId})`);
    } else {
      const [inserted] = await db.insert(companies).values({
        slug: c.slug,
        name: c.name,
        industry: c.industry,
        initial: c.initial,
        drinkAffiliation: c.drinkAffiliation,
        memo: c.memo,
      }).returning({ id: companies.id });
      companyId = inserted.id;
      console.log(`  inserted company: ${c.slug} (id: ${companyId})`);
    }

    for (const g of c.guests) {
      const existingGuest = await db.select()
        .from(guests)
        .where(eq(guests.companyId, companyId))
        .then((rows) => rows.find((r) => r.name === g.name));

      if (existingGuest) {
        console.log(`    skip guest: ${g.name}`);
        continue;
      }

      await db.insert(guests).values({
        companyId,
        name: g.name,
        title: g.title,
        preferences: g.preferences,
        ngFoods: g.ngFoods,
        memo: g.memo,
        budgetMin: g.budgetMin,
        budgetMax: g.budgetMax,
        freq: g.freq,
      });
      console.log(`    inserted guest: ${g.name}`);
    }
  }

  console.log('✅ guest seed complete');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
