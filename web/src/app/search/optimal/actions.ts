'use server';

import { db } from '@/lib/db/client';
import { users, companies, venues } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getStationRoute } from '@/lib/travel/cache';
import { rankVenuesByTravelCost } from '@/lib/travel/score';
import type { TravelPoint, RankedByTravel, VenueTravelCandidate } from '@/lib/travel/types';

type FindOptimalVenuesResult =
  | { ok: true; results: RankedByTravel[] }
  | { ok: false; reason: 'no_office' | 'no_participants' };

function toCoords(lat: string | null, lng: string | null): { lat: number; lng: number } | null {
  return lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
}

export async function findOptimalVenues(participantCompanyIds: string[]): Promise<FindOptimalVenuesResult> {
  const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (!admin?.officeNearestStation) {
    return { ok: false, reason: 'no_office' };
  }

  const participantCompanies = participantCompanyIds.length
    ? await db.select().from(companies).where(inArray(companies.id, participantCompanyIds))
    : [];

  const participants: TravelPoint[] = [
    {
      label: '自社',
      nearestStation: admin.officeNearestStation,
      lat: admin.officeLat,
      lng: admin.officeLng,
    },
    ...participantCompanies
      .filter((c) => c.nearestStation)
      .map((c) => ({
        label: c.name,
        nearestStation: c.nearestStation as string,
        lat: c.lat,
        lng: c.lng,
      })),
  ];

  if (participants.length < 2) {
    return { ok: false, reason: 'no_participants' };
  }

  const candidateVenues: VenueTravelCandidate[] = await db
    .select({
      id: venues.id,
      name: venues.name,
      nearestStation: venues.nearestStation,
      lat: venues.lat,
      lng: venues.lng,
    })
    .from(venues);

  const stationCoords = new Map<string, { lat: number; lng: number } | null>();
  for (const p of participants) stationCoords.set(p.nearestStation, toCoords(p.lat, p.lng));
  for (const v of candidateVenues) {
    if (v.nearestStation) stationCoords.set(v.nearestStation, toCoords(v.lat, v.lng));
  }

  const results = await rankVenuesByTravelCost(
    participants,
    candidateVenues,
    (from, to) => getStationRoute(from, to, stationCoords.get(from) ?? null, stationCoords.get(to) ?? null),
  );

  return { ok: true, results };
}
