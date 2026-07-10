'use server';

import { db } from '@/lib/db/client';
import { tags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addTag(formData: FormData) {
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;

    if (!name || !name.trim()) return;

    await db.insert(tags).values({
        name: name.trim(),
        category,
    });

    revalidatePath('/settings/tags');
}

export async function deleteTag(id: string) {
    await db.delete(tags).where(eq(tags.id, id));
    revalidatePath('/settings/tags');
}
