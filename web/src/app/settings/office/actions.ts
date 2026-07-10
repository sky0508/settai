'use server';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateOffice(formData: FormData) {
  const officeAddress = ((formData.get('officeAddress') as string) || '').trim() || null;
  const officeNearestStation = ((formData.get('officeNearestStation') as string) || '').trim() || null;
  const officeLat = ((formData.get('officeLat') as string) || '').trim() || null;
  const officeLng = ((formData.get('officeLng') as string) || '').trim() || null;

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
  if (!admin) return;

  await db
    .update(users)
    .set({ officeAddress, officeNearestStation, officeLat, officeLng })
    .where(eq(users.id, admin.id));

  revalidatePath('/settings/office');
}
