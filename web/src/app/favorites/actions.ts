'use server';

import { db } from '@/lib/db/client';
import { favorites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleFavorite(venueId: string) {
    const existing = await db
        .select()
        .from(favorites)
        .where(eq(favorites.venueId, venueId))
        .limit(1);

    if (existing.length > 0) {
        await db.delete(favorites).where(eq(favorites.venueId, venueId));
    } else {
        await db.insert(favorites).values({ venueId });
    }

    revalidatePath(`/venues/${venueId}`);
    revalidatePath('/favorites');
}
