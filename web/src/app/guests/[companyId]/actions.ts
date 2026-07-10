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

// 企業拠点（住所・最寄り駅・座標）を更新。最適店検索の移動元に使う（okinawa 1050 移植）
export async function updateCompanyStation(id: string, formData: FormData, slug: string) {
    const address = ((formData.get('address') as string) || '').trim() || null;
    const nearestStation = ((formData.get('nearestStation') as string) || '').trim() || null;
    const lat = ((formData.get('lat') as string) || '').trim() || null;
    const lng = ((formData.get('lng') as string) || '').trim() || null;

    await db.update(companies).set({ address, nearestStation, lat, lng }).where(eq(companies.id, id));
    revalidatePath(`/guests/${slug}`);
}

export async function deleteCompany(id: string) {
    // guests の cascade delete がスキーマに設定済みなので company のみ消せばOK
    await db.delete(companies).where(eq(companies.id, id));
    revalidatePath('/guests');
    redirect('/guests');
}
