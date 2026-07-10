import SearchClient from './SearchClient';
import { db } from '@/lib/db/client';
import { guests, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAllGuestsContext } from './actions';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; role?: string; guestId?: string; purpose?: string; }>;
}) {
  const sp = await searchParams;
  let initialCompany = sp.company ?? '';
  let initialRole = sp.role ?? '';
  let initialPurpose = sp.purpose ?? '';
  let initialNgFoods: string[] = [];
  let initialGenres: string[] = [];
  let initialBase = '';

  if (sp.guestId) {
    const guestRows = await db.select().from(guests).where(eq(guests.id, sp.guestId)).limit(1);
    if (guestRows.length > 0) {
      const g = guestRows[0];
      initialRole = g.title;
      initialNgFoods = g.ngFoods || [];
      initialGenres = g.preferences || [];
      if (g.origin) {
        initialBase = g.origin;
      }

      const compRows = await db.select().from(companies).where(eq(companies.id, g.companyId)).limit(1);
      if (compRows.length > 0) {
        initialCompany = compRows[0].name;
      }
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
      allComps={allComps}
      allGuests={allGuests}

    />
  );
}
