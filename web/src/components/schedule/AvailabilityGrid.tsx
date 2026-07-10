'use client';

import { useMemo, useRef, useState } from 'react';
import { fmtDate, fmtDow, fmtTime, dateKey } from '@/lib/schedule/time';

export type GridSlot = { id: string; startsAt: string; sortIndex: number };

type Props = {
  slots: GridSlot[];
  initialSelected?: string[];
  heatmap?: Record<string, number>; // slotId -> 参加OK人数
  maxCount?: number;
  readOnly?: boolean;                // 集計表示（塗り不可）
  fieldName?: string;                // hidden input 名（送信用）
};

const GOLD = '#c2a15a';
const GOLD_D = '#b8944a';

export default function AvailabilityGrid({
  slots,
  initialSelected = [],
  heatmap,
  maxCount,
  readOnly = false,
  fieldName = 'slotIds',
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const painting = useRef(false);
  const paintMode = useRef(true); // true=追加 / false=解除

  // 列=日付・行=時刻 に整形（sortIndex 順で最初に現れた順を採用）
  const { dates, times, cellMap } = useMemo(() => {
    const dseen = new Map<string, string>(); // dateKey -> 代表 startsAt
    const tseen = new Map<string, string>(); // 'HH:mm' -> startsAt
    const map = new Map<string, string>();    // `${dateKey}__${HH:mm}` -> slotId
    const ordered = [...slots].sort((a, b) => a.sortIndex - b.sortIndex);
    for (const s of ordered) {
      const dk = dateKey(s.startsAt);
      const tk = fmtTime(s.startsAt);
      if (!dseen.has(dk)) dseen.set(dk, s.startsAt);
      if (!tseen.has(tk)) tseen.set(tk, s.startsAt);
      map.set(`${dk}__${tk}`, s.id);
    }
    return {
      dates: [...dseen.entries()],  // [dateKey, startsAt]
      times: [...tseen.keys()],     // 'HH:mm'
      cellMap: map,
    };
  }, [slots]);

  const max = maxCount ?? (heatmap ? Math.max(1, ...Object.values(heatmap)) : 1);

  const apply = (slotId: string | undefined) => {
    if (!slotId || readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (paintMode.current) next.add(slotId);
      else next.delete(slotId);
      return next;
    });
  };

  const heatBg = (slotId: string) => {
    const c = heatmap?.[slotId] ?? 0;
    if (!c) return '#fbf8f1';
    const ratio = c / max;
    return `rgba(194,161,90,${(0.15 + 0.72 * ratio).toFixed(3)})`;
  };

  return (
    <div>
      {/* ===== PC: ドラッグ塗りグリッド ===== */}
      <div className="hidden md:block overflow-x-auto pb-1">
        <table
          className="border-separate"
          style={{ borderSpacing: 0, userSelect: 'none' }}
          onMouseLeave={() => (painting.current = false)}
        >
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
                        <div
                          style={{
                            width: 74, height: 30, borderRadius: 6,
                            background: 'repeating-linear-gradient(45deg,#f3efe6,#f3efe6 4px,#eee7d8 4px,#eee7d8 8px)',
                          }}
                        />
                      </td>
                    );
                  }
                  const isSel = selected.has(slotId);
                  const bg = readOnly ? heatBg(slotId) : (isSel ? GOLD : '#fbf8f1');
                  const count = heatmap?.[slotId] ?? 0;
                  const ratio = count / max;
                  return (
                    <td key={dk} className="p-0.5">
                      <div
                        onMouseDown={(e) => {
                          if (readOnly) return;
                          e.preventDefault();
                          painting.current = true;
                          paintMode.current = !isSel;
                          apply(slotId);
                        }}
                        onMouseEnter={() => { if (painting.current) apply(slotId); }}
                        onMouseUp={() => (painting.current = false)}
                        style={{
                          width: 74, height: 30, borderRadius: 6,
                          border: `1px solid ${isSel ? GOLD_D : '#e9e2d4'}`,
                          background: bg,
                          cursor: readOnly ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background .05s',
                        }}
                      >
                        {readOnly && count > 0 && (
                          <span className="text-[11px] font-bold" style={{ color: ratio > 0.55 ? '#fff' : '#8a6a1f' }}>{count}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== スマホ: 日付ごとタップリスト ===== */}
      <div className="md:hidden">
        {dates.map(([dk, iso]) => (
          <div key={dk}>
            <div className="flex items-center gap-2 font-bold text-[13px] mt-3.5 mb-2" style={{ color: '#17253f' }}>
              <span className="material-symbols-outlined text-[17px]" style={{ color: GOLD }}>calendar_today</span>
              {fmtDate(iso)}({fmtDow(iso)})
            </div>
            {times.map((tk) => {
              const slotId = cellMap.get(`${dk}__${tk}`);
              if (!slotId) return null;
              const isSel = selected.has(slotId);
              const count = heatmap?.[slotId] ?? 0;
              return (
                <button
                  key={tk}
                  type="button"
                  onClick={() => { if (readOnly) return; paintMode.current = !isSel; apply(slotId); }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-3 mb-2 text-left"
                  style={{
                    border: `1px solid ${isSel ? GOLD_D : '#eee6d8'}`,
                    background: isSel ? '#fbf3df' : '#fff',
                    cursor: readOnly ? 'default' : 'pointer',
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: `2px solid ${isSel ? GOLD_D : '#cfc6b2'}`,
                      background: isSel ? GOLD : 'transparent',
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#fff', opacity: isSel ? 1 : 0 }}>check</span>
                  </span>
                  <span className="text-[15px] font-medium" style={{ color: '#22314f' }}>{tk}</span>
                  {readOnly && count > 0 && (
                    <span className="ml-auto text-[12px] font-bold" style={{ color: '#8a6a1f' }}>{count}名OK</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!readOnly && (
        <>
          <input type="hidden" name={fieldName} value={JSON.stringify([...selected])} />
          <div className="flex items-center gap-3 text-[11.5px] mt-3" style={{ color: '#6f7a8f' }}>
            <span><span className="inline-block w-4 h-4 rounded align-[-3px] mr-1" style={{ background: GOLD }} />参加OK</span>
            <span className="ml-auto font-bold" style={{ color: '#17253f' }}>{selected.size} 枠を選択中</span>
          </div>
        </>
      )}
    </div>
  );
}
