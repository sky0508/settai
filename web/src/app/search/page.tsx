import SearchClient from './SearchClient';
import { db } from '@/lib/db/client';
import { guests, companies, reservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAllGuestsContext } from './actions';

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; role?: string; guestId?: string; purpose?: string; base?: string; reservationId?: string; }>;
}) {
  const sp = await searchParams;
  let initialCompany = sp.company ?? '';
  let initialRole = sp.role ?? '';
  let initialPurpose = sp.purpose ?? '';
  let initialNgFoods: string[] = [];
  let initialGenres: string[] = [];
  let initialPartySize: number | undefined;
  // 拠点（動線）: 明示指定 base > ゲストの出身 > 会社の本社所在地 の優先順
  let initialBase = sp.base ?? '';

  // 確定済み会食（予約）から来た場合: 用途・人数・日時を引き継ぐ（再入力させない）
  let reservationContext: { id: string; label: string } | null = null;
  if (sp.reservationId) {
    const [rsv] = await db.select().from(reservations).where(eq(reservations.id, sp.reservationId)).limit(1);
    if (rsv) {
      if (rsv.purpose) initialPurpose = rsv.purpose;
      if (rsv.headcount) initialPartySize = rsv.headcount;
      const parts: string[] = [];
      if (rsv.scheduledAt) {
        const d = new Date(rsv.scheduledAt);
        parts.push(`${d.getUTCMonth() + 1}/${d.getUTCDate()}(${DOW_JA[d.getUTCDay()]}) ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
      }
      if (rsv.headcount) parts.push(`${rsv.headcount}名`);
      if (rsv.purpose) parts.push(rsv.purpose);
      reservationContext = { id: rsv.id, label: parts.join(' ・ ') || 'この会食' };
    }
  }

  if (sp.guestId) {
    const guestRows = await db.select().from(guests).where(eq(guests.id, sp.guestId)).limit(1);
    if (guestRows.length > 0) {
      const g = guestRows[0];
      initialRole = g.title;
      initialNgFoods = g.ngFoods || [];
      initialGenres = g.preferences || [];
      if (!initialBase && g.origin) {
        initialBase = g.origin;
      }

      const compRows = await db.select().from(companies).where(eq(companies.id, g.companyId)).limit(1);
      if (compRows.length > 0) {
        initialCompany = compRows[0].name;
        // ゲストに拠点が無ければ会社の本社所在地を拠点に使う
        if (!initialBase && compRows[0].address) {
          initialBase = compRows[0].address;
        }
      }
    }
  } else if (initialCompany && !initialBase) {
    // 会社名だけ渡された場合（会社詳細の「お店を探す」）、本社所在地を拠点にセット
    const compRows = await db.select().from(companies).where(eq(companies.name, initialCompany)).limit(1);
    if (compRows.length > 0 && compRows[0].address) {
      initialBase = compRows[0].address;
    }
  }

  const { allComps, allGuests } = await getAllGuestsContext();

  return (
    <SearchClient
      initialCompany={initialCompany}
      initialRole={initialRole}
      initialPurpose={initialPurpose}
      initialNgFoods={initialNgFoods}
      initialGenres={initialGenres}
      initialBase={initialBase}
      initialGuestId={sp.guestId}
      initialPartySize={initialPartySize}
      reservationId={sp.reservationId}
      reservationLabel={reservationContext?.label ?? null}
      allComps={allComps}
      allGuests={allGuests}
    />
  );
}
