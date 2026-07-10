export type RouteResult = {
  minutes: number;
  transfers: number | null;
  source: 'ekispert' | 'heuristic';
};

export type TravelPoint = {
  label: string;
  nearestStation: string;
  lat: string | null;
  lng: string | null;
};

export type VenueTravelCandidate = {
  id: string;
  name: string;
  nearestStation: string | null;
  lat: string | null;
  lng: string | null;
};

export type TravelBreakdownEntry = {
  label: string;
  minutes: number;
  transfers: number | null;
  cost: number;
};

export type RankedByTravel = {
  venueId: string;
  venueName: string;
  averageCost: number;
  breakdown: TravelBreakdownEntry[];
};
