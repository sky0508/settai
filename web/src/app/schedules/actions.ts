'use server';

import { db } from '@/lib/db/client';
import {
  schedulePolls,
  scheduleSlots,
  scheduleParticipants,
  reservations,
} from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { newToken } from '@/lib/schedule/tokens';
import { generateSlots } from '@/lib/schedule/time';

// 会食を作る: 候補スロットを一括生成してポールを作成
export async function createPoll(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const note = (formData.get('note') as string)?.trim() || null;
  const purpose = (formData.get('purpose') as string) || null;
  const dateFrom = formData.get('dateFrom') as string;
  const dateTo = formData.get('dateTo') as string;
  const timeFrom = formData.get('timeFrom') as string;
  const timeTo = formData.get('timeTo') as string;
  const slotMinutes = Number(formData.get('slotMinutes') || 30);
  const headcountHint = Number(formData.get('headcount') || 0) || null;

  if (!title || !dateFrom || !dateTo || !timeFrom || !timeTo) {
    throw new Error('タイトル・日付範囲・時間帯は必須です。');
  }
  if (dateTo < dateFrom) throw new Error('終了日は開始日以降にしてください。');
  if (timeTo <= timeFrom) throw new Error('終了時刻は開始時刻より後にしてください。');

  const seeds = generateSlots({ dateFrom, dateTo, timeFrom, timeTo, slotMinutes });
  if (seeds.length === 0) throw new Error('候補スロットが生成されませんでした。範囲を見直してください。');

  const [poll] = await db
    .insert(schedulePolls)
    .values({
      title,
      note,
      purpose,
      headcountHint,
      publicToken: newToken(),
      adminToken: newToken(),
      status: 'open',
      ownerId: null, // login seam
    })
    .returning({ id: schedulePolls.id, adminToken: schedulePolls.adminToken });

  await db.insert(scheduleSlots).values(
    seeds.map((s) => ({
      pollId: poll.id,
      startsAt: s.startsAt,
      slotMinutes,
      sortIndex: s.sortIndex,
    }))
  );

  revalidatePath('/schedules');
  redirect(`/host/${poll.adminToken}`);
}

// 日程を確定: reservations 行を生成してダッシュボードに載せる
export async function confirmSlot(formData: FormData) {
  const adminToken = formData.get('adminToken') as string;
  const slotId = formData.get('slotId') as string;
  if (!adminToken || !slotId) throw new Error('不正なリクエストです。');

  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) throw new Error('会食が見つかりません。');
  if (poll.status !== 'open') throw new Error('この会食はすでに確定済みです。');

  const [slot] = await db.select().from(scheduleSlots).where(eq(scheduleSlots.id, slotId));
  if (!slot || slot.pollId !== poll.id) throw new Error('候補枠が見つかりません。');

  const [pc] = await db
    .select({ c: count() })
    .from(scheduleParticipants)
    .where(eq(scheduleParticipants.pollId, poll.id));
  const headcount = pc?.c ?? poll.headcountHint ?? null;

  const [reservation] = await db
    .insert(reservations)
    .values({
      scheduledAt: slot.startsAt,
      status: 'pending', // 店未定 → ダッシュボードで「調整中」
      headcount,
      purpose: poll.purpose,
      ownerId: null,
    })
    .returning({ id: reservations.id });

  await db
    .update(schedulePolls)
    .set({
      status: 'date_confirmed',
      confirmedSlotId: slotId,
      reservationId: reservation.id,
      updatedAt: new Date(),
    })
    .where(eq(schedulePolls.id, poll.id));

  // TODO(Phase4): 参加者へ Stage1 メール（日程確定）を送信
  revalidatePath('/dashboard');
  revalidatePath(`/host/${adminToken}`);
  redirect(`/host/${adminToken}`);
}
