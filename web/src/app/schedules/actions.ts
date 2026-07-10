'use server';

import { db } from '@/lib/db/client';
import {
  schedulePolls,
  scheduleSlots,
  scheduleParticipants,
  scheduleResponses,
  reservations,
} from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
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

// 会食（poll）を削除: 一覧から取り除く。候補枠・参加者・回答は cascade で削除される。
// （日程確定済みで作成された reservations 行は残す＝ダッシュボードの予定はそのまま）
export async function deletePoll(pollId: string) {
  await db.delete(schedulePolls).where(eq(schedulePolls.id, pollId));
  revalidatePath('/schedules');
}

// 主催者が候補枠を「不可枠」としてブロック/解除する。
export async function toggleSlotBlock(adminToken: string, slotId: string) {
  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) throw new Error('会食が見つかりません。');

  const [slot] = await db.select().from(scheduleSlots).where(eq(scheduleSlots.id, slotId));
  if (!slot || slot.pollId !== poll.id) throw new Error('候補枠が見つかりません。');

  await db.update(scheduleSlots).set({ blocked: !slot.blocked }).where(eq(scheduleSlots.id, slotId));
  revalidatePath(`/host/${adminToken}`);
}

// 主催者マトリクス: 参加者×候補枠の可否をトグルする（行の存在=参加OK）。
export async function toggleParticipantSlot(adminToken: string, participantId: string, slotId: string) {
  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) throw new Error('会食が見つかりません。');

  const [participant] = await db.select().from(scheduleParticipants).where(eq(scheduleParticipants.id, participantId));
  if (!participant || participant.pollId !== poll.id) throw new Error('参加者が見つかりません。');

  const [slot] = await db.select().from(scheduleSlots).where(eq(scheduleSlots.id, slotId));
  if (!slot || slot.pollId !== poll.id) throw new Error('候補枠が見つかりません。');

  const [existing] = await db
    .select()
    .from(scheduleResponses)
    .where(and(eq(scheduleResponses.participantId, participantId), eq(scheduleResponses.slotId, slotId)));

  if (existing) {
    await db.delete(scheduleResponses).where(eq(scheduleResponses.id, existing.id));
  } else {
    await db.insert(scheduleResponses).values({ participantId, slotId });
  }

  revalidatePath(`/host/${adminToken}`);
}

// 主催者が参加者を直接追加する（公開リンクを待たずに名簿へ登録）。
// (pollId,email) で upsert。回答枠はまだ無し（後で本人がリンクから回答できる）。
export async function addParticipantByHost(adminToken: string, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!name || !email) throw new Error('お名前とメールアドレスは必須です。');

  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) throw new Error('会食が見つかりません。');

  const [existing] = await db
    .select()
    .from(scheduleParticipants)
    .where(and(eq(scheduleParticipants.pollId, poll.id), eq(scheduleParticipants.email, email)));

  if (existing) {
    await db
      .update(scheduleParticipants)
      .set({ name, updatedAt: new Date() })
      .where(eq(scheduleParticipants.id, existing.id));
  } else {
    await db
      .insert(scheduleParticipants)
      .values({ pollId: poll.id, name, email, editToken: newToken() });
  }

  revalidatePath(`/host/${adminToken}`);
}

// 回答者を削除: 主催者ページの回答者一覧から取り除く（回答も cascade で削除）
export async function deleteParticipant(adminToken: string, participantId: string) {
  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) throw new Error('会食が見つかりません。');

  const [participant] = await db.select().from(scheduleParticipants).where(eq(scheduleParticipants.id, participantId));
  if (!participant || participant.pollId !== poll.id) throw new Error('回答者が見つかりません。');

  await db.delete(scheduleParticipants).where(eq(scheduleParticipants.id, participantId));
  revalidatePath(`/host/${adminToken}`);
}
