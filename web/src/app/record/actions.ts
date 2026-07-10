'use server';

import { db } from '@/lib/db/client';
import { records, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveRecord(formData: FormData) {
  const venueId = formData.get('venueId') as string | null;
  const guestId = formData.get('guestId') as string | null;
  const rating = Number(formData.get('rating') ?? 0) || null;
  const wentWell = (formData.get('wentWell') as string) || null;
  const reflection = (formData.get('reflection') as string) || null;
  const businessOutcome = (formData.get('businessOutcome') as string) || null;
  const dateInput = (formData.get('decidedAt') as string) || null;

  const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);

  await db.insert(records).values({
    venueId: venueId || null,
    guestId: guestId || null,
    ownerId: adminUser?.id ?? null,
    rating,
    wentWell,
    reflection,
    businessOutcome,
    decidedAt: dateInput ? new Date(dateInput) : new Date(),
  });

  redirect('/dashboard');
}

export async function deleteRecord(id: string) {
  await db.delete(records).where(eq(records.id, id));
  revalidatePath('/dashboard');
}
