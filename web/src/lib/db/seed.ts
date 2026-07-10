import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './client';
import { venues, companies, guests, records, users, tags, favorites, reservations } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Seeding data...');

    await db.delete(records);
    await db.delete(favorites);
    await db.delete(reservations);
    await db.delete(guests);
    await db.delete(companies);
    await db.delete(venues);
    await db.delete(users);

    const [boss] = await db.insert(users).values({
        email: 'boss@example.com',
        passwordHash: 'dummy',
        name: '鈴木 部長 (社内)',
        companyName: '自社株式会社',
        role: 'admin',
    }).returning();

    const [member] = await db.insert(users).values({
        email: 'member@example.com',
        passwordHash: 'dummy',
        name: '佐藤 担当 (社内)',
        companyName: '自社株式会社',
        role: 'user',
    }).returning();

    // 2. Create Venues (10 locations)
    const vRows = await db.insert(venues).values([
        {
            slug: 'kitaohji-kyobashi',
            name: '個室会席 北大路 京橋茶寮',
            nameKana: 'コシツカイセキ キタオオジ キョウバシサリョウ',
            genre: '日本料理',
            area: '京橋',
            address: '東京都中央区京橋2-2-1 京橋エドグラン',
            nearestStation: '京橋',
            walkMinutes: 1,
            budgetMin: 15000,
            budgetMax: 20000,
            formalityGrade: 'S',
            formalityOverride: 'S',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
            ownerId: boss.id,
            tags: ['京橋', '和食', '完全個室'],
        },
        {
            slug: 'takemoto',
            name: '京橋たけ本',
            genre: '日本料理',
            area: '京橋',
            address: '東京都中央区京橋2-6-13',
            nearestStation: '宝町',
            walkMinutes: 3,
            lat: '35.6766',
            lng: '139.7709',
            budgetMin: 18000,
            budgetMax: 25000,
            formalityGrade: 'S',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '掘りごたつ',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
            ownerId: boss.id,
            tags: ['日本料理', '完全個室'],
        },
        {
            slug: 'nihonbashi-yukari',
            name: '日本料理 日本橋ゆかり',
            nameKana: 'ニホンリョウリ ニホンバシユカリ',
            genre: '和食・割烹',
            area: '日本橋',
            address: '東京都中央区日本橋3-2-14',
            nearestStation: '日本橋',
            walkMinutes: 1,
            lat: '35.6811',
            lng: '139.7744',
            budgetMin: 15000,
            budgetMax: 25000,
            formalityGrade: 'A',
            hasPrivateRoom: true,
            privateRoomType: '座敷',
            seatStyle: '座敷',
            soundproof: '不可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
            ownerId: member.id,
        },
        {
            slug: 'sushi-umimi',
            name: '八重洲 鮨 海味',
            nameKana: 'ヤエス スシ ウミ',
            genre: '寿司',
            area: '八重洲',
            address: '東京都中央区八重洲1-7-15',
            nearestStation: '東京',
            walkMinutes: 3,
            lat: '35.6800',
            lng: '139.7700',
            budgetMin: 20000,
            budgetMax: 30000,
            formalityGrade: 'S',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
            ownerId: boss.id,
        },
        {
            slug: 'yuko',
            name: '完全個室懐石 柚こう',
            nameKana: 'カンゼンコシツカイセキ ユコウ',
            genre: '懐石料理',
            area: '日本橋',
            address: '東京都中央区日本橋2-1-14',
            nearestStation: '日本橋',
            walkMinutes: 2,
            lat: '35.6830',
            lng: '139.7744',
            budgetMin: 12000,
            budgetMax: 18000,
            formalityGrade: 'A',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        },
        {
            slug: 'asada',
            name: '赤坂浅田',
            genre: '加賀料理',
            area: '赤坂',
            address: '東京都港区赤坂3-6-4',
            nearestStation: '溜池山王',
            walkMinutes: 5,
            budgetMin: 25000,
            budgetMax: 35000,
            formalityGrade: 'S',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        },
        {
            slug: 'roppongi-ukai',
            name: '六本木うかい亭',
            genre: '鉄板焼き',
            area: '六本木',
            address: '東京都港区六本木6-12-4',
            nearestStation: '六本木',
            walkMinutes: 3,
            budgetMin: 30000,
            budgetMax: 40000,
            formalityGrade: 'S',
            hasPrivateRoom: true,
            privateRoomType: '半個室',
            seatStyle: '椅子',
            soundproof: '不可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        },
        {
            slug: 'bistro-marx',
            name: 'ビストロ マルクス',
            genre: 'フレンチ',
            area: '銀座',
            address: '東京都中央区銀座5-8-1',
            nearestStation: '銀座',
            walkMinutes: 1,
            budgetMin: 10000,
            budgetMax: 15000,
            formalityGrade: 'B',
            hasPrivateRoom: false,
            privateRoomType: 'なし',
            seatStyle: '椅子',
            soundproof: '不明',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        },
        {
            slug: 'mikuni',
            name: 'オテル・ドゥ・ミクニ',
            genre: 'フレンチ',
            area: '四ツ谷',
            address: '東京都新宿区若葉1-18',
            nearestStation: '四ツ谷',
            walkMinutes: 7,
            budgetMin: 20000,
            budgetMax: 30000,
            formalityGrade: 'S',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        },
        {
            slug: 'kakiyasu',
            name: '柿安 銀座店',
            genre: 'すき焼き・しゃぶしゃぶ',
            area: '銀座',
            address: '東京都中央区銀座7-9-15',
            nearestStation: '銀座',
            walkMinutes: 4,
            budgetMin: 15000,
            budgetMax: 20000,
            formalityGrade: 'A',
            hasPrivateRoom: true,
            privateRoomType: '完全個室',
            seatStyle: '椅子',
            soundproof: '可',
            beerAffiliation: 'unknown',
            beerConfidence: 'unknown',
            source: 'seed',
        }
    ]).returning();

    // 3. Create Companies
    const [kirin] = await db.insert(companies).values({
        slug: 'kirin',
        name: 'キリンホールディングス株式会社',
        industry: '飲料・食品',
        initial: 'K',
        drinkAffiliation: 'kirin',
        ownerId: boss.id,
    }).returning();

    const [asahi] = await db.insert(companies).values({
        slug: 'asahi',
        name: 'アサヒグループホールディングス',
        industry: '飲料・食品',
        initial: 'A',
        drinkAffiliation: 'asahi',
        ownerId: boss.id,
    }).returning();

    const [toyota] = await db.insert(companies).values({
        slug: 'toyota',
        name: 'トヨタ自動車株式会社',
        industry: '自動車',
        initial: 'T',
        drinkAffiliation: 'none',
        ownerId: member.id,
    }).returning();

    const [sony] = await db.insert(companies).values({
        slug: 'sony',
        name: 'ソニーグループ株式会社',
        industry: '電機・IT',
        initial: 'S',
        drinkAffiliation: 'none',
        ownerId: boss.id,
    }).returning();

    // 4. Create Guests
    const [tanaka] = await db.insert(guests).values({
        companyId: kirin.id,
        name: '田中 部長',
        title: '営業本部長',
        preferences: ['和食', '日本酒'],
        ngFoods: ['エビ', 'カニ'],
        ownerId: boss.id,
    }).returning();

    const [yamamoto] = await db.insert(guests).values({
        companyId: asahi.id,
        name: '山本 課長',
        title: 'マーケティング部',
        preferences: ['焼肉', 'ビール'],
        ownerId: member.id,
    }).returning();

    const [sato] = await db.insert(guests).values({
        companyId: toyota.id,
        name: '佐藤 役員',
        title: '専務取締役',
        preferences: ['フレンチ', 'ワイン'],
        ownerId: boss.id,
    }).returning();

    const [watanabe] = await db.insert(guests).values({
        companyId: sony.id,
        name: '渡辺 統括部長',
        title: 'エンタメ部門統括',
        preferences: ['イタリアン', 'ワイン'],
        ngFoods: ['パクチー', '牡蠣'],
        ownerId: boss.id,
    }).returning();

    const [ito] = await db.insert(guests).values({
        companyId: kirin.id,
        name: '伊藤 担当',
        title: '営業推進',
        preferences: ['居酒屋', 'ビール'],
        ownerId: member.id,
    }).returning();

    // 5. Create Records (Past Dinners by Boss)
    await db.insert(records).values([
        {
            venueId: vRows[0].id, // きたおおじ
            guestId: tanaka.id,
            ownerId: boss.id, // 鈴木部長(自社)が同席
            purpose: '会食',
            partySize: 4,
            rating: 5,
            wentWell: '完全個室で密談ができた。日本酒の銘柄に大満足されていた。',
            businessOutcome: '商談前進',
            createdAt: new Date('2026-06-15T18:00:00')
        },
        {
            venueId: vRows[3].id, // 鮨 海味
            guestId: sato.id,
            ownerId: boss.id, // 鈴木部長(自社)が同席
            purpose: '会食',
            partySize: 2,
            rating: 4,
            wentWell: '寿司のクオリティは間違いないが、予約が取りにくい。',
            businessOutcome: '関係深化',
            createdAt: new Date('2026-07-01T19:00:00')
        }
    ]);

    console.log('Seeding completed!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
