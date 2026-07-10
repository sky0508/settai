import { describe, it, expect } from 'vitest';
import { haversineKm, estimateHeuristicMinutes } from './heuristic';

describe('haversineKm', () => {
  it('赤道上の緯度1度分の距離はおよそ111km', () => {
    const km = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(113);
  });

  it('同一地点の距離は0', () => {
    const km = haversineKm({ lat: 35.68, lng: 139.77 }, { lat: 35.68, lng: 139.77 });
    expect(km).toBeCloseTo(0, 5);
  });
});

describe('estimateHeuristicMinutes', () => {
  it('時速25km換算で所要時間を概算する', () => {
    // 赤道上111km ÷ 25km/h × 60 ≈ 266分
    const minutes = estimateHeuristicMinutes({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(minutes).toBeGreaterThan(255);
    expect(minutes).toBeLessThan(280);
  });
});
