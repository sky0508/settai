'use client';

import { useMemo, useState, useTransition } from 'react';
import { fmtDate, fmtDow, fmtTime, dateKey } from '@/lib/schedule/time';
import { toggleSlotBlock } from '@/app/schedules/actions';

type Slot = { id: string; startsAt: string; sortIndex: number; blocked: boolean };

export default function SlotBlockEditor({
  adminToken,
  slots,
}: {
  adminToken: string;
  slots: Slot[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { dates, times, cellMap, blockedMap, blockedCount } = useMemo(() => {
    const dseen = new Map<string, string>();
    const tseen = new Map<string, string>();
    const map = new Map<string, string>();
    const bmap = new Map<string, boolean>();
    const ordered = [...slots].sort((a, b) => a.sortIndex - b.sortIndex);
    for (const s of ordered) {
      const dk = dateKey(s.startsAt);
      const tk = fmtTime(s.startsAt);
      if (!dseen.has(dk)) dseen.set(dk, s.startsAt);
      if (!tseen.has(tk)) tseen.set(tk, s.startsAt);
      map.set(`${dk}__${tk}`, s.id);
      bmap.set(s.id, s.blocked);
    }
    return {
      dates: [...dseen.entries()],
      times: [...tseen.keys()],
      cellMap: map,
      blockedMap: bmap,
      blockedCount: [...bmap.values()].filter(Boolean).length,
    };
  }, [slots]);

  const toggle = (slotId: string) => {
    setBusyId(slotId);
    startTransition(async () => {
      await toggleSlotBlock(adminToken, slotId);
      setBusyId(null);
    });
  };

  return (
    <div className="p-5" style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 16, boxShadow: '0 6px 22px rgba(20,35,63,.05)' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 cursor-pointer">
        <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>block</span>
        <b className="font-serif text-[15px]" style={{ color: '#17253f' }}>不可枠のブロック</b>
        {blockedCount > 0 && (
          <span className="text-[11.5px] font-bold rounded-full px-2.5 py-0.5" style={{ background: '#fdecea', color: '#c0504b' }}>{blockedCount} 枠 不可</span>
        )}
        <span className="ml-auto material-symbols-outlined text-[20px]" style={{ color: '#9aa0ab' }}>{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-[12px] mb-3" style={{ color: '#6f7a8f' }}>
            日程を押さえられない枠を選ぶと「不可枠」になります。参加者は不可枠を選べず、確定候補からも除外されます。
          </p>
          <div className="overflow-x-auto pb-1">
            <table className="border-separate" style={{ borderSpacing: 0, userSelect: 'none' }}>
              <thead>
                <tr>
                  <th />
                  {dates.map(([dk, iso]) => (
                    <th key={dk} className="px-1 pb-2 text-center" style={{ minWidth: 76 }}>
                      <div className="text-[12.5px] font-bold" style={{ color: '#17253f' }}>{fmtDate(iso)}</div>
                      <div className="text-[11px]" style={{ color: '#9aa0ab' }}>({fmtDow(iso)})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((tk) => (
                  <tr key={tk}>
                    <td className="pr-2.5 text-right align-middle text-[11px] whitespace-nowrap" style={{ color: '#6f7a8f' }}>{tk}</td>
                    {dates.map(([dk]) => {
                      const slotId = cellMap.get(`${dk}__${tk}`);
                      if (!slotId) {
                        return (
                          <td key={dk} className="p-0.5">
                            <div style={{ width: 74, height: 30, borderRadius: 6, background: 'repeating-linear-gradient(45deg,#f3efe6,#f3efe6 4px,#eee7d8 4px,#eee7d8 8px)' }} />
                          </td>
                        );
                      }
                      const blocked = blockedMap.get(slotId) ?? false;
                      const isBusy = pending && busyId === slotId;
                      return (
                        <td key={dk} className="p-0.5">
                          <button
                            type="button"
                            onClick={() => toggle(slotId)}
                            disabled={isBusy}
                            title={blocked ? '不可枠（クリックで解除）' : 'クリックで不可枠にする'}
                            style={{
                              width: 74, height: 30, borderRadius: 6,
                              border: `1px solid ${blocked ? '#d98b86' : '#e9e2d4'}`,
                              background: blocked
                                ? 'repeating-linear-gradient(45deg,#fbe3e0,#fbe3e0 4px,#f6d3cf 4px,#f6d3cf 8px)'
                                : '#fbf8f1',
                              cursor: isBusy ? 'wait' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: isBusy ? 0.5 : 1,
                            }}
                          >
                            {blocked && (
                              <span className="material-symbols-outlined text-[15px]" style={{ color: '#c0504b' }}>block</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
