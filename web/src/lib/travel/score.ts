import type { TravelPoint, VenueTravelCandidate, RankedByTravel, RouteResult } from './types';

const TRANSFER_PENALTY_MIN = 10;

export type GetRoute = (fromStation: string, toStation: string) => Promise<RouteResult>;

export async function rankVenuesByTravelCost(
  participants: TravelPoint[],
  candidates: VenueTravelCandidate[],
  getRoute: GetRoute,
): Promise<RankedByTravel[]> {
  const results: RankedByTravel[] = [];

  for (const venue of candidates) {
    if (!venue.nearestStation) continue;

    const breakdown = [];
    for (const p of participants) {
      const route = await getRoute(p.nearestStation, venue.nearestStation);
      const cost = route.minutes + (route.transfers ?? 0) * TRANSFER_PENALTY_MIN;
      breakdown.push({ label: p.label, minutes: route.minutes, transfers: route.transfers, cost });
    }

    const averageCost = breakdown.reduce((sum, b) => sum + b.cost, 0) / breakdown.length;
    results.push({ venueId: venue.id, venueName: venue.name, averageCost, breakdown });
  }

  results.sort((a, b) => a.averageCost - b.averageCost);
  return results;
}
