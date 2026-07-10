import 'dotenv/config'; // DATABASE_URL は .env から読む（ハードコード禁止・漏洩対策）

import { db } from './src/lib/db/client';
import { venues, records, guests, companies, favorites } from './src/lib/db/schema';
import { count } from 'drizzle-orm';

async function main() {
    const vCount = await db.select({ c: count() }).from(venues);
    const rCount = await db.select({ c: count() }).from(records);
    const gCount = await db.select({ c: count() }).from(guests);
    const cCount = await db.select({ c: count() }).from(companies);
    const fCount = await db.select({ c: count() }).from(favorites);

    console.log('--- DB Data Counts ---');
    console.log('Venues:', vCount[0].c);
    console.log('Records (会食記録):', rCount[0].c);
    console.log('Guests (ゲスト):', gCount[0].c);
    console.log('Companies (企業):', cCount[0].c);
    console.log('Favorites (お気に入り):', fCount[0].c);
    console.log('----------------------');
    process.exit(0);
}
main();
