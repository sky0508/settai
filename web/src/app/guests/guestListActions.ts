'use server';

import { db } from '@/lib/db/client';
import { guests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteGuestFromList(companyId: string, guestId: string) {
    void companyId;
    await db.delete(guests).where(eq(guests.id, guestId));
    revalidatePath('/guests');
    redirect('/guests');
}
