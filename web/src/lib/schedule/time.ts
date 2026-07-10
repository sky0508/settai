// 日程調整の時刻ユーティリティ（サーバー・クライアント両用の純関数）
// 方針: すべて JST(UTC+9・DST なし) の実インスタントとして扱う。
//   - 保存: JST の wall-clock を表す「本当の UTC 瞬間」を timestamp に入れる
//     （例: 7/15 19:00 JST → 2026-07-15T10:00:00Z）。
//   - 表示: 瞬間に +9h して UTC getter で読む = JST の wall-clock。
//   これで実行環境（Vercel=UTC / Mac=JST）に依存せず一貫し、既存ダッシュボードの
//   local 表示（Sora の JST ブラウザ／サーバー）とも日付が一致する。

export const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

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
      // JST wall-clock を表す実インスタント（UTC = wall-clock - 9h）
      const startsAt = new Date(Date.UTC(day.y, day.mo - 1, day.d, hh, mm) - JST_OFFSET_MS);
      slots.push({ startsAt, sortIndex: sortIndex++ });
    }
  }
  return slots;
}

// startsAt は Date または ISO 文字列を受ける（クライアントには文字列で渡る）
function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}
// 瞬間を +9h シフトして UTC getter で JST wall-clock を読む
function jst(v: Date | string): Date {
  return new Date(toDate(v).getTime() + JST_OFFSET_MS);
}
const pad = (n: number) => String(n).padStart(2, '0');

export function fmtDate(v: Date | string): string {
  const d = jst(v);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
export function fmtDow(v: Date | string): string {
  return DOW_JA[jst(v).getUTCDay()];
}
export function fmtTime(v: Date | string): string {
  const d = jst(v);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
export function dateKey(v: Date | string): string {
  const d = jst(v);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}
export function fmtFull(v: Date | string): string {
  return `${fmtDate(v)}(${fmtDow(v)}) ${fmtTime(v)}`;
}
