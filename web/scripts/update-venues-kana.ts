import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { venues } from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const KANA_MAP: Record<string, string> = {
  '個室会席 北大路 京橋茶寮': 'コシツカイセキ キタオオジ キョウバシサリョウ',
  '個室会席 北大路 京橋茶寮 東京駅店': 'コシツカイセキ キタオオジ キョウバシサリョウ トウキョウエキテン',
  '京橋たけ本': 'キョウバシタケモト',
  '京橋 婆娑羅': 'キョウバシ バサラ',
  '瓢嘻 京橋店': 'ヒョウキ キョウバシテン',
  '個室中華 頤和園 京橋エドグラン店': 'コシツチュウカ イワエン キョウバシエドグランテン',
  'シェ・イノ': 'シェイノ',
  '京橋 天冨良と鮨 いしい': 'キョウバシ テンプラトスシ イシイ',
  '京橋 鮨 好日': 'キョウバシ スシ コウジツ',
  '個室和食 東山 京橋店': 'コシツワショク ヒガシヤマ キョウバシテン',
  '京都つゆしゃぶ CHIRIRI 銀座京橋店': 'キョウトツユシャブ チリリ ギンザキョウバシテン',
  '八重洲 steak & seafood 鉄板焼き 一心': 'ヤエス ステーキ テッパンヤキ イッシン',
  '八重洲 鮨 海味': 'ヤエス スシ ウミ',
  '瓢嘻 八重洲店': 'ヒョウキ ヤエステン',
  'MOTO TOKYO（酛TOKYO）': 'モトトーキョー モトトウキョウ',
  '八重洲 鰻 はし本': 'ヤエス ウナギ ハシモト',
  '八重洲大飯店': 'ヤエスダイハンテン',
  '日本橋浅田': 'ニホンバシアサダ',
  '天ぷら浅沼': 'テンプラアサヌマ',
  '和牛焼肉 土古里 八重洲店': 'ワギュウヤキニク トコリ ヤエステン',
  '日本料理 日本橋ゆかり': 'ニホンリョウリ ニホンバシユカリ',
  '鮨 日本橋 鰤門': 'スシ ニホンバシ ブリモン',
  '鉄板 日本橋 KITAZUMI': 'テッパン ニホンバシ キタズミ',
  '日本橋紫苑': 'ニホンバシシオン',
  '完全個室懐石 1日2組の料亭 柚こう 日本橋本店': 'カンゼンコシツカイセキ ユズコウ ニホンバシホンテン',
  '完全個室懐石 柚こう': 'カンゼンコシツカイセキ ユズコウ',
  '日本橋 いづもや 本店': 'ニホンバシ イヅモヤ ホンテン',
  'Pont d\'Or Inno（ポンドール・イノ）': 'ポンドールイノ',
  '京の馳走 はんなりや': 'キョウノチソウ ハンナリヤ',
  '焼肉 やまと コレド日本橋店': 'ヤキニク ヤマト コレドニホンバシテン',
  '肉鮮問屋 佐々木': 'ニクセンドンヤ ササキ',
  '日本橋天ぷら ふじなみ': 'ニホンバシテンプラ フジナミ',
  // DB固有のエントリ
  '赤坂浅田': 'アカサカアサダ',
  '六本木うかい亭': 'ロッポンギウカイテイ',
  'ビストロ マルクス': 'ビストロマルクス',
  'オテル・ドゥ・ミクニ': 'オテルドゥミクニ',
  '柿安 銀座店': 'カキヤス ギンザテン',
};

async function main() {
  const allVenues = await db.select({ id: venues.id, name: venues.name, nameKana: venues.nameKana }).from(venues);
  console.log(`▶ updating nameKana for ${allVenues.length} venues...`);

  for (const v of allVenues) {
    const kana = KANA_MAP[v.name];
    if (!kana) {
      console.warn(`  no kana mapping for: ${v.name}`);
      continue;
    }
    if (v.nameKana === kana) {
      console.log(`  skip (already set): ${v.name}`);
      continue;
    }
    await db.update(venues).set({ nameKana: kana }).where(eq(venues.id, v.id));
    console.log(`  updated: ${v.name} → ${kana}`);
  }
  console.log('✓ done');
}

main().catch(console.error);
