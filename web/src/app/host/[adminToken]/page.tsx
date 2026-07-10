import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/client';
import {
  schedulePolls,
  scheduleSlots,
  scheduleParticipants,
  scheduleResponses,
  guests,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { GridSlot } from '@/components/schedule/AvailabilityGrid';
import CopyButton from '@/components/schedule/CopyButton';
import InviteMailPreview from '@/components/schedule/InviteMailPreview';
import ParticipantMatrix from '@/components/schedule/ParticipantMatrix';
import DeleteButton from '@/components/ui/DeleteButton';
import { confirmSlot, deleteParticipant, addParticipantByHost } from '@/app/schedules/actions';
import { fmtFull } from '@/lib/schedule/time';

type Props = { params: Promise<{ adminToken: string }> };

export default async function HostPage({ params }: Props) {
  const { adminToken } = await params;

  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.adminToken, adminToken));
  if (!poll) notFound();

  const slotRows = await db.select().from(scheduleSlots).where(eq(scheduleSlots.pollId, poll.id));
  const slots: GridSlot[] = slotRows
    .map((s) => ({ id: s.id, startsAt: s.startsAt!.toISOString(), sortIndex: s.sortIndex }))
    .sort((a, b) => a.sortIndex - b.sortIndex);
  const slotById = new Map(slotRows.map((s) => [s.id, s]));

  // 不可枠（ブロック）: 確定候補・最有力枠から除外する（#13 で編集UIを追加予定）
  const blockedSet = new Set(slotRows.filter((s) => s.blocked).map((s) => s.id));
  const selectableSlots = slots.filter((s) => !blockedSet.has(s.id));

  const participants = await db.select().from(scheduleParticipants).where(eq(scheduleParticipants.pollId, poll.id));

  // 参加者追加フォームの名前補完用（ゲスト台帳の氏名）
  const guestRows = await db.select({ name: guests.name }).from(guests);
  const guestNames = Array.from(new Set(guestRows.map((g) => g.name)));
  const respRows = await db
    .select({ slotId: scheduleResponses.slotId, participantId: scheduleResponses.participantId })
    .from(scheduleResponses)
    .innerJoin(scheduleParticipants, eq(scheduleResponses.participantId, scheduleParticipants.id))
    .where(eq(scheduleParticipants.pollId, poll.id));

  const heatmap: Record<string, number> = {};
  const perParticipant: Record<string, number> = {};
  for (const r of respRows) {
    heatmap[r.slotId] = (heatmap[r.slotId] ?? 0) + 1;
    perParticipant[r.participantId] = (perParticipant[r.participantId] ?? 0) + 1;
  }
  const participantCount = participants.length;

  // マトリクス（参加者×候補枠）の可否キー
  const responseKeys = respRows.map((r) => `${r.participantId}__${r.slotId}`);

  // 最有力枠（最多得票 → 同数なら早い枠）。不可枠は候補にしない。
  let best: { id: string; count: number; sortIndex: number } | null = null;
  for (const s of selectableSlots) {
    const c = heatmap[s.id] ?? 0;
    if (!best || c > best.count || (c === best.count && s.sortIndex < best.sortIndex)) {
      best = { id: s.id, count: c, sortIndex: s.sortIndex };
    }
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const shareUrl = `${base}/s/${poll.publicToken}`;

  const gold = 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)';
  const cardStyle = { background: '#fff', border: '1px solid #eee6d8', borderRadius: 16, boxShadow: '0 6px 22px rgba(20,35,63,.05)' } as const;
  const confirmedSlot = poll.confirmedSlotId ? slotById.get(poll.confirmedSlotId) : null;

  return (
    <div className="min-h-screen" style={{ background: '#f4f1ea' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-9 flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(150deg,#e6c987,#b98f3f)', clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }}>
              <span className="material-symbols-outlined text-[17px]" style={{ color: '#17253f', fontVariationSettings: "'FILL' 1" }}>temple_buddhist</span>
            </span>
            <span className="font-serif font-bold text-[16px]" style={{ color: '#17253f' }}>会食ナビ ・ 主催者ページ</span>
          </div>
          <Link href="/schedules" className="text-[12.5px] font-bold" style={{ color: '#8a93a4' }}>← 会食一覧</Link>
        </div>

        <h1 className="font-serif font-bold text-[23px]" style={{ color: '#17253f' }}>{poll.title}</h1>
        <p className="text-[13px] mt-1 mb-5" style={{ color: '#6f7a8f' }}>色が濃い枠ほど参加できる人が多い候補です。</p>

        {/* 共有リンク */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          <div className="flex items-center gap-2 flex-1 min-w-[280px] rounded-xl px-3 py-2.5" style={{ background: '#f6f3ec', border: '1px solid #eee6d8' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#b8944a' }}>public</span>
            <span className="flex-1 text-[12px] truncate font-mono" style={{ color: '#22314f' }}>{shareUrl}</span>
            <CopyButton text={shareUrl} label="参加者リンクをコピー" />
          </div>
        </div>

        {/* 確定済みバナー */}
        {confirmedSlot && (
          <div className="flex items-center gap-2 text-[13.5px] font-bold rounded-xl px-4 py-3 mb-5" style={{ background: '#e4f0e6', color: '#3d8a5c' }}>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {fmtFull(confirmedSlot.startsAt!.toISOString())} に確定しました。
            <Link href="/dashboard" className="ml-auto text-[12.5px] underline" style={{ color: '#2f6f49' }}>ダッシュボードで見る</Link>
          </div>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          <div className="md:grid md:gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
            {/* ヒートマップ */}
            <div className="p-5 mb-4 md:mb-0" style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>insights</span>
                <b className="font-serif text-[15px]" style={{ color: '#17253f' }}>回答の重なり</b>
                <span className="ml-auto text-[11.5px] font-bold rounded-full px-2.5 py-0.5" style={{ background: '#eef1f6', color: '#3a4661' }}>参加者 {participantCount} 名</span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: '#6f7a8f' }}>縦＝日時、横＝参加者。セルをクリックで可否を切り替えられます。</p>
              <ParticipantMatrix
                adminToken={adminToken}
                slots={slots}
                participants={participants.map((p) => ({ id: p.id, name: p.name }))}
                responseKeys={responseKeys}
              />
            </div>

            {/* 右カラム: 回答者 + 確定 */}
            <div className="p-5" style={cardStyle}>
              <div className="font-serif font-bold text-[15px] mb-2" style={{ color: '#17253f' }}>
                <span className="material-symbols-outlined text-[18px] align-[-4px] mr-1" style={{ color: '#c2a15a' }}>how_to_reg</span>回答者
              </div>
              {participants.length === 0 ? (
                <p className="text-[12.5px] py-3" style={{ color: '#9aa0ab' }}>まだ回答がありません。参加者リンクを共有するか、下で直接追加できます。</p>
              ) : (
                <div className="flex flex-col mb-3">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 py-2 text-[13px]" style={{ borderBottom: '1px solid #f2efe8' }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: '#26385a', color: '#c9d2e2' }}>{p.name.slice(0, 1)}</span>
                      <span className="flex-1 truncate" style={{ color: '#22314f' }}>{p.name}</span>
                      <span className="text-[11.5px] font-bold rounded-full px-2 py-0.5" style={{ background: '#e4f0e6', color: '#3d8a5c' }}>{perParticipant[p.id] ?? 0}枠</span>
                      <form action={deleteParticipant.bind(null, adminToken, p.id)}>
                        <DeleteButton
                          message={`「${p.name}」さんの回答を削除しますか？`}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-navy/25 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="回答者を削除"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </DeleteButton>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* 主催者が参加者を直接追加（名前は台帳から補完、メールは手入力） */}
              <form action={addParticipantByHost.bind(null, adminToken)} className="flex flex-col gap-2 rounded-xl p-3 mb-3" style={{ background: '#f6f3ec', border: '1px solid #eee6d8' }}>
                <div className="text-[11.5px] font-bold" style={{ color: '#5a6478' }}>参加者を追加</div>
                <input
                  name="name"
                  required
                  placeholder="お名前"
                  list="host-guest-names"
                  className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none"
                  style={{ border: '1px solid #d9d2c4', color: '#17253f' }}
                />
                <datalist id="host-guest-names">
                  {guestNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="メールアドレス"
                  className="w-full rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none"
                  style={{ border: '1px solid #d9d2c4', color: '#17253f' }}
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white cursor-pointer"
                  style={{ background: '#14233f' }}
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  名簿に追加
                </button>
              </form>

              {poll.status === 'open' && slots.length > 0 && (
                <form action={confirmSlot} className="mt-2">
                  <input type="hidden" name="adminToken" value={adminToken} />
                  {best && best.count > 0 && (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3 text-[12.5px]" style={{ background: '#fbf3df', border: '1px solid #ecd9a8', color: '#6a5320' }}>
                      <span className="material-symbols-outlined text-[17px]" style={{ color: '#b8944a' }}>recommend</span>
                      <div>最有力枠：<b>{fmtFull(slotById.get(best.id)!.startsAt!.toISOString())}</b>（{best.count}名OK）</div>
                    </div>
                  )}
                  <label className="block text-[11.5px] font-bold mb-1.5" style={{ color: '#5a6478' }}>確定する枠</label>
                  <select name="slotId" defaultValue={best?.id ?? slots[0]?.id} className="w-full rounded-lg px-3 py-2 text-sm bg-white outline-none mb-3" style={{ border: '1px solid #d9d2c4', color: '#17253f' }}>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>{fmtFull(s.startsAt)} — {heatmap[s.id] ?? 0}名OK</option>
                    ))}
                  </select>
                  <button type="submit" className="w-full justify-center px-4 py-2.5 rounded-xl text-white font-semibold text-[13.5px] cursor-pointer shadow-md flex items-center gap-2" style={{ background: gold }}>
                    <span className="material-symbols-outlined text-[18px]">event_available</span>この枠で日程を確定
                  </button>
                  <p className="text-[11px] text-center mt-2" style={{ color: '#9aa0ab' }}>確定すると「今後の会食予定」に追加されます</p>
                </form>
              )}

              {poll.status !== 'open' && (
                <div className="mt-2 rounded-xl px-3 py-3 text-[12.5px]" style={{ background: '#eef1f6', color: '#3a4661' }}>
                  日程は確定済みです。次は店を決めて招待を送ります（近日実装）。
                </div>
              )}
            </div>
          </div>

          {/* 参加者への招待メール文面（実送信はせず、コピー / メールソフト起動） */}
          <InviteMailPreview
            title={poll.title}
            note={poll.note}
            purpose={poll.purpose}
            shareUrl={shareUrl}
            confirmedLabel={confirmedSlot ? fmtFull(confirmedSlot.startsAt!.toISOString()) : null}
            recipientEmails={participants.map((p) => p.email)}
          />
        </div>
      </div>
    </div>
  );
}
