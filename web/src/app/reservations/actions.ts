'use server';

import { db } from '@/lib/db/client';
import { reservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createReservation(formData: FormData) {
    const venueId = formData.get('venueId') as string;
    const guestId = formData.get('guestId') as string;
    const scheduledAtStr = formData.get('scheduledAt') as string;
    const headcount = Number(formData.get('headcount') || 0);
    const purpose = formData.get('purpose') as string;
    const note = formData.get('note') as string;

    if (!venueId || !guestId || !scheduledAtStr) {
        throw new Error('店舗、ゲスト、日時は必須です。');
    }

    const scheduledAt = new Date(scheduledAtStr);

    await db.insert(reservations).values({
        venueId,
        guestId,
        scheduledAt,
        status: 'confirmed',
        headcount,
        purpose,
        note: note || null,
        ownerId: null, // UI for users is not done yet
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function updateReservationStatus(id: string, status: string) {
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
    revalidatePath('/dashboard');
}
