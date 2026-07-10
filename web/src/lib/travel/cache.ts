import { db } from '@/lib/db/client';
import { stationRoutes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { fetchEkispertRoute } from './ekispert';
import { estimateHeuristicMinutes } from './heuristic';
import type { RouteResult } from './types';

const NO_COORDS_PENALTY_MINUTES = 999;

function sortedPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

export async function getStationRoute(
  fromStation: string,
  toStation: string,
  fromCoords: { lat: number; lng: number } | null,
  toCoords: { lat: number; lng: number } | null,
): Promise<RouteResult> {
  const [a, b] = sortedPair(fromStation, toStation);

  const [cached] = await db
    .select()
    .from(stationRoutes)
    .where(and(eq(stationRoutes.fromStation, a), eq(stationRoutes.toStation, b)))
    .limit(1);

  if (cached) {
    return { minutes: cached.minutes, transfers: cached.transfers, source: cached.source as 'ekispert' | 'heuristic' };
  }

  const ekispertResult = await fetchEkispertRoute(fromStation, toStation);
  if (ekispertResult) {
    await db.insert(stationRoutes).values({
      fromStation: a,
      toStation: b,
      minutes: ekispertResult.minutes,
      transfers: ekispertResult.transfers,
      source: 'ekispert',
    });
    return ekispertResult;
  }

  const minutes = fromCoords && toCoords ? estimateHeuristicMinutes(fromCoords, toCoords) : NO_COORDS_PENALTY_MINUTES;
  await db.insert(stationRoutes).values({
    fromStation: a,
    toStation: b,
    minutes,
    transfers: null,
    source: 'heuristic',
  });
  return { minutes, transfers: null, source: 'heuristic' };
}
