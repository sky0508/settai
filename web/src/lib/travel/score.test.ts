import { describe, it, expect } from 'vitest';
import { rankVenuesByTravelCost } from './score';
import type { TravelPoint, VenueTravelCandidate, RouteResult } from './types';

const PARTICIPANTS: TravelPoint[] = [
  { label: '自社', nearestStation: '京橋', lat: null, lng: null },
  { label: 'A社', nearestStation: '新宿', lat: null, lng: null },
];

const VENUES: VenueTravelCandidate[] = [
  { id: 'v1', name: '近い店', nearestStation: '東京', lat: null, lng: null },
  { id: 'v2', name: '遠い店', nearestStation: '八王子', lat: null, lng: null },
];

const ROUTES: Record<string, RouteResult> = {
  '京橋->東京': { minutes: 5, transfers: 0, source: 'heuristic' },
  '新宿->東京': { minutes: 15, transfers: 1, source: 'heuristic' },
  '京橋->八王子': { minutes: 60, transfers: 2, source: 'heuristic' },
  '新宿->八王子': { minutes: 40, transfers: 1, source: 'heuristic' },
};

const fakeGetRoute = async (from: string, to: string): Promise<RouteResult> => {
  const route = ROUTES[`${from}->${to}`];
  if (!route) throw new Error(`no fake route for ${from}->${to}`);
  return route;
};

describe('rankVenuesByTravelCost', () => {
  it('平均移動コストが小さい店舗が上位に来る', async () => {
    const results = await rankVenuesByTravelCost(PARTICIPANTS, VENUES, fakeGetRoute);

    expect(results).toHaveLength(2);
    expect(results[0].venueId).toBe('v1');
    expect(results[1].venueId).toBe('v2');
  });

  it('乗換1回につき10分のペナルティを加算する', async () => {
    const results = await rankVenuesByTravelCost(PARTICIPANTS, VENUES, fakeGetRoute);
    const v1 = results.find((r) => r.venueId === 'v1')!;

    expect(v1.averageCost).toBe(15);
  });

  it('参加者ごとの内訳を返す', async () => {
    const results = await rankVenuesByTravelCost(PARTICIPANTS, VENUES, fakeGetRoute);
    const v1 = results.find((r) => r.venueId === 'v1')!;

    expect(v1.breakdown).toEqual([
      { label: '自社', minutes: 5, transfers: 0, cost: 5 },
      { label: 'A社', minutes: 15, transfers: 1, cost: 25 },
    ]);
  });

  it('乗換回数がnull（ヒューリスティック不明）の場合はペナルティ0として扱う', async () => {
    const participants: TravelPoint[] = [{ label: '自社', nearestStation: '京橋', lat: null, lng: null }];
    const venues: VenueTravelCandidate[] = [{ id: 'v3', name: '不明店', nearestStation: '謎駅', lat: null, lng: null }];
    const getRoute = async (): Promise<RouteResult> => ({ minutes: 30, transfers: null, source: 'heuristic' });

    const results = await rankVenuesByTravelCost(participants, venues, getRoute);

    expect(results[0].averageCost).toBe(30);
    expect(results[0].breakdown[0].transfers).toBeNull();
  });
});
