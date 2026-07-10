'use server';

import { db } from '@/lib/db/client';
import {
  schedulePolls,
  scheduleSlots,
  scheduleParticipants,
  scheduleResponses,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { newToken } from '@/lib/schedule/tokens';

// 参加者の回答送信（ログイン不要・公開）。(pollId,email) で upsert し、
// その参加者の回答スロットを丸ごと置き換える。
export async function submitResponse(formData: FormData) {
  const publicToken = formData.get('publicToken') as string;
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const rawSlots = (formData.get('slotIds') as string) || '[]';

  if (!publicToken) throw new Error('不正なリクエストです。');
  if (!name || !email) throw new Error('お名前とメールアドレスは必須です。');

  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.publicToken, publicToken));
  if (!poll) throw new Error('会食が見つかりません。');
  if (poll.status !== 'open') throw new Error('この会食の日程調整は締め切られています。');

  let slotIds: string[];
  try {
    slotIds = JSON.parse(rawSlots);
    if (!Array.isArray(slotIds)) slotIds = [];
  } catch {
    slotIds = [];
  }

  // 選ばれた slotId が poll のものか検証
  const validSlots = await db.select({ id: scheduleSlots.id }).from(scheduleSlots).where(eq(scheduleSlots.pollId, poll.id));
  const validSet = new Set(validSlots.map((s) => s.id));
  const selected = slotIds.filter((id) => validSet.has(id));

  // participant upsert by (pollId, email)
  const [existing] = await db
    .select()
    .from(scheduleParticipants)
    .where(and(eq(scheduleParticipants.pollId, poll.id), eq(scheduleParticipants.email, email)));

  let participantId: string;
  let editToken: string;
  if (existing) {
    participantId = existing.id;
    editToken = existing.editToken;
    await db
      .update(scheduleParticipants)
      .set({ name, updatedAt: new Date() })
      .where(eq(scheduleParticipants.id, participantId));
    await db.delete(scheduleResponses).where(eq(scheduleResponses.participantId, participantId));
  } else {
    editToken = newToken();
    const [created] = await db
      .insert(scheduleParticipants)
      .values({ pollId: poll.id, name, email, editToken })
      .returning({ id: scheduleParticipants.id });
    participantId = created.id;
  }

  if (selected.length > 0) {
    await db.insert(scheduleResponses).values(selected.map((slotId) => ({ participantId, slotId })));
  }

  revalidatePath(`/s/${publicToken}`);
  redirect(`/s/${publicToken}?done=${editToken}`);
}
