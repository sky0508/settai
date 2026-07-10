'use server';

import { db } from '@/lib/db/client';
import { guests, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteGuest(guestId: string, companySlug: string) {
    await db.delete(guests).where(eq(guests.id, guestId));
    revalidatePath(`/guests/${companySlug}`);
    redirect(`/guests/${companySlug}`);
}

export async function updateCompanyMemo(id: string, memo: string, slug: string) {
    await db.update(companies).set({ memo }).where(eq(companies.id, id));
    revalidatePath(`/guests/${slug}`);
}

export async function updateCompanyAddress(id: string, address: string, slug: string) {
    await db.update(companies).set({ address: address.trim() || null }).where(eq(companies.id, id));
    revalidatePath(`/guests/${slug}`);
}

export async function deleteCompany(id: string) {
    // guests の cascade delete がスキーマに設定済みなので company のみ消せばOK
    await db.delete(companies).where(eq(companies.id, id));
    revalidatePath('/guests');
    redirect('/guests');
}
