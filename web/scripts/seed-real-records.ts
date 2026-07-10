import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db/client';
import { venues, guests, records } from '../src/lib/db/schema';
import { count } from 'drizzle-orm';
import * as crypto from 'crypto';

async function seed() {
    console.log('Fetching venues and guests...');
    const allVenues = await db.select().from(venues);
    const allGuests = await db.select().from(guests);

    if (allVenues.length === 0 || allGuests.length === 0) {
        console.error('No venues or guests found. Please seed them first.');
        process.exit(1);
    }

    const outcomes = ['商談前進', '関係深化', '謝罪解決', 'その他', '商談前進', '関係深化'];
    const wentWellMemos = [
        '料理が美味しく、雰囲気が良かった。',
        '個室が非常に静かで商談に集中できた。',
        'サービスのタイミングが絶妙で好印象。',
        '日本酒のラインナップに先方が大変喜んでいた。',
        '夜景が綺麗で、和やかなムードになった。',
    ];

    console.log('Inserting 20 sample records...');

    const now = new Date();

    for (let i = 0; i < 20; i++) {
        const venue = allVenues[i % allVenues.length];
        const guest = allGuests[i % allGuests.length];

        // Spread dates over the last 6 months
        const dateOffset = Math.floor(Math.random() * 180); // 0 to 180 days ago
        const createdAt = new Date(now.getTime() - dateOffset * 24 * 60 * 60 * 1000);
        const decidedAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after creation

        let rating = 4;
        const rnd = Math.random();
        if (rnd > 0.7) rating = 5;
        else if (rnd < 0.2) rating = 3;

        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        const memo = wentWellMemos[Math.floor(Math.random() * wentWellMemos.length)];

        await db.insert(records).values({
            id: crypto.randomUUID(),
            venueId: venue.id,
            guestId: guest.id,
            decidedAt,
            rating,
            wentWell: memo,
            businessOutcome: outcome,
            createdAt,
        });
    }

    const rCount = await db.select({ c: count() }).from(records);
    console.log(`Successfully seeded! Total records in DB: ${rCount[0].c}`);
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
