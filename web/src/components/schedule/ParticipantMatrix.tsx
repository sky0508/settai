'use client';

import { useMemo, useState, useTransition } from 'react';
import { fmtDate, fmtDow, fmtTime } from '@/lib/schedule/time';
import { toggleParticipantSlot } from '@/app/schedules/actions';

type Slot = { id: string; startsAt: string; sortIndex: number };
type Participant = { id: string; name: string };

const GOLD = '#c2a15a';

export default function ParticipantMatrix({
  adminToken,
  slots,
  participants,
  // `${participantId}__${slotId}` の集合（参加OK）
  responseKeys,
}: {
  adminToken: string;
  slots: Slot[];
  participants: Participant[];
  responseKeys: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  // 楽観的更新用のローカル集合
  const [okSet, setOkSet] = useState<Set<string>>(new Set(responseKeys));

  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => a.sortIndex - b.sortIndex),
    [slots]
  );

  const countBySlot = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of orderedSlots) {
      let c = 0;
      for (const p of participants) if (okSet.has(`${p.id}__${s.id}`)) c++;
      m.set(s.id, c);
    }
    return m;
  }, [orderedSlots, participants, okSet]);

  const toggle = (participantId: string, slotId: string) => {
    const key = `${participantId}__${slotId}`;
    // 楽観的更新
    setOkSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setBusy(key);
    startTransition(async () => {
      await toggleParticipantSlot(adminToken, participantId, slotId);
      setBusy(null);
    });
  };

  if (participants.length === 0) {
    return (
      <p className="text-[13px] py-6 text-center" style={{ color: '#9aa0ab' }}>
        参加者がまだいません。右の「参加者を追加」から登録するか、参加者リンクを共有してください。
      </p>
    );
  }
  if (orderedSlots.length === 0) {
    return <p className="text-[13px] py-6 text-center" style={{ color: '#9aa0ab' }}>候補枠がありません。</p>;
  }

  return (
    <div className="overflow-x-auto pb-1">
      <table className="border-separate" style={{ borderSpacing: 0, userSelect: 'none' }}>
        <thead>
          <tr>
            <th className="text-left px-2 pb-2 sticky left-0 z-10" style={{ background: '#fff' }}>
              <span className="text-[11px] font-bold" style={{ color: '#9aa0ab' }}>日時 \ 参加者</span>
            </th>
            {participants.map((p) => (
              <th key={p.id} className="px-1.5 pb-2 text-center" style={{ minWidth: 60 }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold mx-auto"
                  style={{ background: '#26385a', color: '#c9d2e2' }}
                  title={p.name}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div className="text-[10.5px] mt-1 max-w-[64px] truncate mx-auto" style={{ color: '#5a6478' }}>{p.name}</div>
              </th>
            ))}
            <th className="px-2 pb-2 text-center" style={{ minWidth: 56 }}>
              <span className="text-[11px] font-bold" style={{ color: '#9aa0ab' }}>OK数</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orderedSlots.map((s) => {
            const okCount = countBySlot.get(s.id) ?? 0;
            const ratio = participants.length ? okCount / participants.length : 0;
            return (
              <tr key={s.id}>
                <td className="pr-3 py-1 whitespace-nowrap text-right align-middle sticky left-0 z-10" style={{ background: '#fff' }}>
                  <span className="text-[12px] font-bold" style={{ color: '#17253f' }}>{fmtDate(s.startsAt)}</span>
                  <span className="text-[11px] ml-1" style={{ color: '#9aa0ab' }}>({fmtDow(s.startsAt)})</span>
                  <span className="text-[12px] ml-1.5" style={{ color: '#3a4661' }}>{fmtTime(s.startsAt)}</span>
                </td>
                {participants.map((p) => {
                  const key = `${p.id}__${s.id}`;
                  const ok = okSet.has(key);
                  const isBusy = pending && busy === key;
                  return (
                    <td key={p.id} className="p-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(p.id, s.id)}
                        disabled={isBusy}
                        title={ok ? '参加OK（クリックで取消）' : 'クリックで参加OK'}
                        className="flex items-center justify-center mx-auto"
                        style={{
                          width: 40, height: 28, borderRadius: 6,
                          border: `1px solid ${ok ? '#b8944a' : '#e9e2d4'}`,
                          background: ok ? GOLD : '#fbf8f1',
                          cursor: isBusy ? 'wait' : 'pointer',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {ok && <span className="material-symbols-outlined text-[16px]" style={{ color: '#fff' }}>check</span>}
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 text-center">
                  <span
                    className="inline-block text-[11.5px] font-bold rounded-full px-2 py-0.5"
                    style={{
                      background: okCount === 0 ? '#f0eee9' : `rgba(61,138,92,${(0.12 + 0.6 * ratio).toFixed(2)})`,
                      color: okCount === 0 ? '#9aa0ab' : '#2f6f49',
                    }}
                  >
                    {okCount}名
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-3 text-[11.5px] mt-3" style={{ color: '#6f7a8f' }}>
        <span><span className="inline-block w-4 h-4 rounded align-[-3px] mr-1" style={{ background: GOLD }} />参加OK</span>
        <span>セルをクリックで主催者が直接入力できます（参加者リンクからの回答も反映されます）</span>
      </div>
    </div>
  );
}
