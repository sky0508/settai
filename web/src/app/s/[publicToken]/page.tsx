import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/client';
import {
  schedulePolls,
  scheduleSlots,
  scheduleParticipants,
  scheduleResponses,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import AvailabilityGrid, { GridSlot } from '@/components/schedule/AvailabilityGrid';
import { submitResponse } from './actions';

type Props = {
  params: Promise<{ publicToken: string }>;
  searchParams: Promise<{ done?: string }>;
};

export default async function ParticipantPage({ params, searchParams }: Props) {
  const { publicToken } = await params;
  const { done } = await searchParams;

  const [poll] = await db.select().from(schedulePolls).where(eq(schedulePolls.publicToken, publicToken));
  if (!poll) notFound();

  const slotRows = await db.select().from(scheduleSlots).where(eq(scheduleSlots.pollId, poll.id));
  const slots: GridSlot[] = slotRows
    .map((s) => ({ id: s.id, startsAt: s.startsAt!.toISOString(), sortIndex: s.sortIndex }))
    .sort((a, b) => a.sortIndex - b.sortIndex);

  // ヒートマップ（回答済みの重なり）
  const respRows = await db
    .select({ slotId: scheduleResponses.slotId })
    .from(scheduleResponses)
    .innerJoin(scheduleParticipants, eq(scheduleResponses.participantId, scheduleParticipants.id))
    .where(eq(scheduleParticipants.pollId, poll.id));
  const heatmap: Record<string, number> = {};
  for (const r of respRows) heatmap[r.slotId] = (heatmap[r.slotId] ?? 0) + 1;
  const participants = await db.select().from(scheduleParticipants).where(eq(scheduleParticipants.pollId, poll.id));
  const participantCount = participants.length;

  const closed = poll.status !== 'open';
  const gold = 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)';

  return (
    <div className="min-h-screen" style={{ background: '#f4f1ea' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-8 h-9 flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(150deg,#e6c987,#b98f3f)', clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#17253f', fontVariationSettings: "'FILL' 1" }}>temple_buddhist</span>
          </span>
          <span className="font-serif font-bold text-[17px]" style={{ color: '#17253f' }}>会食ナビ</span>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8" style={{ border: '1px solid #eee6d8', boxShadow: '0 6px 22px rgba(20,35,63,.06)' }}>
          <h1 className="font-serif font-bold text-[20px]" style={{ color: '#17253f' }}>{poll.title}</h1>
          {poll.note && <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#6f7a8f' }}>{poll.note}</p>}

          {closed ? (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[13px] font-bold rounded-xl px-4 py-3 mb-5" style={{ background: '#e8eefb', color: '#3f5a8a' }}>
                <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                この会食の日程調整は締め切られました。
              </div>
              <div className="text-[12px] font-bold mb-2" style={{ color: '#5a6478' }}>みんなの回答（{participantCount}名）</div>
              <AvailabilityGrid slots={slots} heatmap={heatmap} maxCount={Math.max(1, participantCount)} readOnly />
            </div>
          ) : done ? (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[13.5px] font-bold rounded-xl px-4 py-3 mb-5" style={{ background: '#e4f0e6', color: '#3d8a5c' }}>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                回答ありがとうございました！主催者が日程を確定するとご連絡します。
              </div>
              <div className="text-[12px] font-bold mb-2" style={{ color: '#5a6478' }}>現在の回答状況（{participantCount}名）</div>
              <AvailabilityGrid slots={slots} heatmap={heatmap} maxCount={Math.max(1, participantCount)} readOnly />
              <div className="mt-4">
                <Link href={`/s/${publicToken}`} className="text-[13px] font-bold" style={{ color: '#b8944a' }}>回答を修正する</Link>
              </div>
            </div>
          ) : (
            <form action={submitResponse} className="mt-5">
              <input type="hidden" name="publicToken" value={publicToken} />
              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>お名前 <span style={{ color: '#c0504b' }}>*</span></label>
                  <input name="name" required placeholder="山本 太郎" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>メールアドレス <span style={{ color: '#c0504b' }}>*</span></label>
                  <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
                </div>
              </div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#5a6478' }}>参加できる枠を選択（PCはドラッグ／スマホはタップ）</label>
              <AvailabilityGrid slots={slots} />
              <div className="flex justify-end mt-5">
                <button type="submit" className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer shadow-md flex items-center gap-2" style={{ background: gold }}>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  回答を送信
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-[11px] mt-4" style={{ color: '#9aa0ab' }}>Powered by 会食ナビ ・ ログイン不要でご回答いただけます</p>
      </div>
    </div>
  );
}
