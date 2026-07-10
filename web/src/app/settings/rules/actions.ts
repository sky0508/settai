'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { brandRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function addBrandRule(formData: FormData) {
  const company     = (formData.get('company') as string).trim();
  const affiliation = (formData.get('affiliation') as string).trim();
  const effect      = formData.get('effect') as string;
  const label       = (formData.get('label') as string).trim();

  if (!company || !affiliation || !effect || !label) return;

  await db.insert(brandRules).values({ company, affiliation, effect, label });
  revalidatePath('/settings/rules');
}

export async function deleteBrandRule(id: string) {
  await db.delete(brandRules).where(eq(brandRules.id, id));
  revalidatePath('/settings/rules');
}
