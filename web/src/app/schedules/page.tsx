import Link from 'next/link';
import { db } from '@/lib/db/client';
import { schedulePolls, scheduleParticipants } from '@/lib/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import DeleteButton from '@/components/ui/DeleteButton';
import { deletePoll } from './actions';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  open:           { label: '日程調整中', bg: '#f6ecd2', color: '#a37f2b' },
  date_confirmed: { label: '日程確定・店決め',  bg: '#e8eefb', color: '#3f5a8a' },
  venue_decided:  { label: '確定',       bg: '#e4f0e6', color: '#3d8a5c' },
  cancelled:      { label: '中止',       bg: '#f0eef0', color: '#8a8390' },
};

export default async function SchedulesPage() {
  const polls = await db.select().from(schedulePolls).orderBy(desc(schedulePolls.createdAt));

  // 参加人数（一覧表示用）
  const counts = await db
    .select({ pollId: scheduleParticipants.pollId, c: count() })
    .from(scheduleParticipants)
    .groupBy(scheduleParticipants.pollId);
  const countMap = new Map(counts.map((r) => [r.pollId, r.c]));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div>
          <h1 className="font-serif font-bold text-[clamp(22px,3vw,30px)] m-0" style={{ color: '#17253f' }}>会食を作る</h1>
          <p className="text-[13px] mt-1" style={{ color: '#6f7a8f' }}>候補日を投票で決めて、店を選び、参加者へ招待を送るまで。</p>
        </div>
        <Link
          href="/schedules/new"
          className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl text-white text-[14px] font-bold"
          style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 6px 16px rgba(184,148,74,0.3)' }}
        >
          <span className="material-symbols-outlined text-[19px]">add</span>
          新しい会食をつくる
        </Link>
      </div>

      <div className="bg-white rounded-xl p-1" style={{ border: '1px solid #eee6d8', boxShadow: '0 6px 22px rgba(20,35,63,.05)' }}>
        {polls.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="material-symbols-outlined text-[40px]" style={{ color: '#d8cdb4' }}>edit_calendar</span>
            <p className="text-[14px] mt-2" style={{ color: '#9aa0ab' }}>まだ会食がありません。</p>
            <Link href="/schedules/new" className="inline-block mt-3 text-[13px] font-bold" style={{ color: '#b8944a' }}>＋ 最初の会食をつくる</Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {polls.map((p) => {
              const st = STATUS_MAP[p.status] ?? STATUS_MAP.open;
              const n = countMap.get(p.id) ?? 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors rounded-lg"
                  style={{ borderBottom: '1px solid #f2efe8' }}
                >
                  <Link href={`/host/${p.adminToken}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f4ead4' }}>
                      <span className="material-symbols-outlined text-[21px]" style={{ color: '#bf9540' }}>event</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-bold truncate group-hover:text-gold transition-colors" style={{ color: '#22314f' }}>{p.title}</div>
                      <div className="text-[11.5px]" style={{ color: '#9aa0ab' }}>回答 {n} 名{p.purpose ? ` ・ ${p.purpose}` : ''}</div>
                    </div>
                    <span className="text-[11.5px] font-bold rounded-full px-2.5 py-0.5 shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </Link>
                  <form action={deletePoll.bind(null, p.id)} className="shrink-0">
                    <DeleteButton
                      message={`会食「${p.title}」を削除しますか？\n候補日・回答者・回答もすべて削除されます。`}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-navy/25 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="会食を削除"
                    >
                      <span className="material-symbols-outlined text-[19px]">delete</span>
                    </DeleteButton>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
