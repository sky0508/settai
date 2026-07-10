// 日程調整の時刻ユーティリティ（サーバー・クライアント両用の純関数）
// 方針: スロットは JST の wall-clock を「UTC ラベル」で保存し、読み出しも UTC getter で
//       行う。これでサーバー実行環境の TZ（Vercel=UTC）に依存せず数字が往復する。

export const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];

export type SlotSeed = { startsAt: Date; sortIndex: number };

export type GenerateSlotsInput = {
  dateFrom: string; // 'YYYY-MM-DD'
  dateTo: string;   // 'YYYY-MM-DD'
  timeFrom: string; // 'HH:mm'
  timeTo: string;   // 'HH:mm'（この時刻の枠は含まない = 開始時刻の集合）
  slotMinutes: number;
};

function eachDate(from: string, to: string): { y: number; mo: number; d: number }[] {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  const out: { y: number; mo: number; d: number }[] = [];
  for (let t = start; t <= end; t += 86400000) {
    const dt = new Date(t);
    out.push({ y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
  }
  return out;
}

export function generateSlots(input: GenerateSlotsInput): SlotSeed[] {
  const { dateFrom, dateTo, timeFrom, timeTo, slotMinutes } = input;
  const [fromH, fromM] = timeFrom.split(':').map(Number);
  const [toH, toM] = timeTo.split(':').map(Number);
  const startMin = fromH * 60 + fromM;
  const endMin = toH * 60 + toM;
  const slots: SlotSeed[] = [];
  let sortIndex = 0;
  for (const day of eachDate(dateFrom, dateTo)) {
    for (let min = startMin; min < endMin; min += slotMinutes) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      const startsAt = new Date(Date.UTC(day.y, day.mo - 1, day.d, hh, mm));
      slots.push({ startsAt, sortIndex: sortIndex++ });
    }
  }
  return slots;
}

// startsAt は Date または ISO 文字列を受ける（クライアントには文字列で渡る）
function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

export function fmtDate(v: Date | string): string {
  const dt = toDate(v);
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
}
export function fmtDow(v: Date | string): string {
  return DOW_JA[toDate(v).getUTCDay()];
}
export function fmtTime(v: Date | string): string {
  const dt = toDate(v);
  return `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
}
export function dateKey(v: Date | string): string {
  const dt = toDate(v);
  return `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`;
}
export function fmtFull(v: Date | string): string {
  return `${fmtDate(v)}(${fmtDow(v)}) ${fmtTime(v)}`;
}
