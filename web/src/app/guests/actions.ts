'use server';

import { db } from '@/lib/db/client';
import { companies, guests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteCompany(id: string) {
    await db.delete(companies).where(eq(companies.id, id));
    revalidatePath('/guests');
    redirect('/guests');
}

// ゲスト一覧ページの「人で探す」タブの削除ボタン用
export async function deleteGuest(companyId: string, guestId: string) {
    void companyId;
    await db.delete(guests).where(eq(guests.id, guestId));
    revalidatePath('/guests');
    redirect('/guests');
}
