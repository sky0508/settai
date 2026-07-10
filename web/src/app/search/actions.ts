'use server';


import { db } from '@/lib/db/client';
import { venues, brandRules, records, guests, companies, favorites, users } from '@/lib/db/schema';
import { rankVenues } from '@/lib/rule-engine';
import type { SearchInput, RankedVenue } from '@/lib/types';
import { eq, inArray } from 'drizzle-orm';

export async function searchVenues(input: SearchInput): Promise<RankedVenue[]> {
  const [user] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);

  const [allVenues, allRules, allRecords, allGuests, allCompanies, userFavorites] = await Promise.all([
    db.select().from(venues),
    db.select().from(brandRules),
    db.select().from(records),
    db.select().from(guests),
    db.select().from(companies),
    user ? db.select().from(favorites).where(eq(favorites.userId, user.id)) : Promise.resolve([]),
  ]);

  const favoriteVenueIds = new Set(userFavorites.map(f => f.venueId));

  let ranked = rankVenues(allVenues, input, allRules, allRecords, allGuests, allCompanies);

  // Set isFavorite flag
  ranked = ranked.map(v => ({ ...v, isFavorite: favoriteVenueIds.has(v.id) }));

  // Filter if favoritesOnly is active
  if (input.favoritesOnly) {
    ranked = ranked.filter(v => v.isFavorite);
  }

  return ranked;
}

export async function getAllGuestsContext() {
  const [allComps, allGuests] = await Promise.all([
    db.select({ id: companies.id, name: companies.name, slug: companies.slug }).from(companies).orderBy(companies.name),
    db.select({ id: guests.id, name: guests.name, title: guests.title, companyId: guests.companyId, ngFoods: guests.ngFoods, preferences: guests.preferences, origin: guests.origin }).from(guests).orderBy(guests.name),
  ]);
  return { allComps, allGuests };
}
