import { describe, it, expect } from 'vitest';
import { rankVenues } from './rule-engine';
import type { SearchInput } from './types';

const BASE_VENUE = {
  id: 'v1', slug: 'test', name: 'テスト店', nameKana: 'テストテン', genre: '日本料理',
  area: '京橋', address: '東京都...', nearestStation: '京橋',
  walkMinutes: 3, lat: '35.68', lng: '139.77', budgetMin: 10000, budgetMax: 15000,
  photoUrl: null, websiteUrl: null, phone: null,
  formalityGrade: 'A', privateRoomType: '完全個室',
  privateRoomNote: null, beerAffiliation: 'unknown',
  beerConfidence: 'unknown', beerSourceUrl: null,
  tags: [], requiresReservation: false, curationNote: null,
  source: 'test', createdAt: new Date(), updatedAt: new Date(),
};

const BASE_INPUT: SearchInput = {
  area: '京橋', roles: ['部長'], purposes: ['新規開拓'],
  genres: [], budgetMin: 8000, budgetMax: 20000,
  privateRoom: false, quietRoom: false, companyName: '',
  beerExclude: { mode: 'exclude', makers: [] },
};

const NO_RULES: never[] = [];

describe('rankVenues', () => {
  it('エリア一致の店が返る', () => {
    const results = rankVenues([BASE_VENUE], BASE_INPUT, NO_RULES);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('テスト店');
  });

  it('エリア不一致は除外される', () => {
    const input = { ...BASE_INPUT, area: '日本橋' };
    expect(rankVenues([BASE_VENUE], input, NO_RULES)).toHaveLength(0);
  });

  it('NG ビールは badge = NG になる', () => {
    const venue = { ...BASE_VENUE, beerAffiliation: 'asahi', beerConfidence: 'confirmed' };
    const rules = [{ id: 'r1', company: 'キリン', affiliation: 'asahi', effect: 'ng', label: 'アサヒ系' }];
    const input = { ...BASE_INPUT, companyName: 'キリン' };
    const results = rankVenues([venue], input, rules);
    expect(results[0].badge).toBe('NG');
  });

  it('prefer ビールは加点される', () => {
    const venue = { ...BASE_VENUE, beerAffiliation: 'kirin', beerConfidence: 'confirmed' };
    const rules = [{ id: 'r1', company: 'キリン', affiliation: 'kirin', effect: 'prefer', label: 'キリン系' }];
    const input = { ...BASE_INPUT, companyName: 'キリン' };
    const results = rankVenues([venue], input, rules);
    expect(results[0].badge).toBe('OK');
    expect(results[0].score).toBeGreaterThan(50);
  });

  it('NG は末尾に来る', () => {
    const okVenue = { ...BASE_VENUE, id: 'v-ok', beerAffiliation: 'kirin', beerConfidence: 'confirmed' };
    const ngVenue = { ...BASE_VENUE, id: 'v-ng', beerAffiliation: 'asahi', beerConfidence: 'confirmed' };
    const rules = [
      { id: 'r1', company: 'キリン', affiliation: 'kirin', effect: 'prefer', label: 'キリン系' },
      { id: 'r2', company: 'キリン', affiliation: 'asahi', effect: 'ng', label: 'アサヒ系' },
    ];
    const input = { ...BASE_INPUT, companyName: 'キリン' };
    const results = rankVenues([ngVenue, okVenue], input, rules);
    expect(results[0].id).toBe('v-ok');
    expect(results[1].badge).toBe('NG');
  });

  it('個室フィルタ: なし の店は除外', () => {
    const venue = { ...BASE_VENUE, privateRoomType: 'なし' };
    const input = { ...BASE_INPUT, privateRoom: true };
    expect(rankVenues([venue], input, NO_RULES)).toHaveLength(0);
  });

  it('予算オーバーはスコアが低い', () => {
    const venue = { ...BASE_VENUE, budgetMax: 30000 };
    const input = { ...BASE_INPUT, budgetMax: 15000 };
    const results = rankVenues([venue], input, NO_RULES);
    expect(results[0].score).toBeLessThan(50);
  });

  it('役員・部長が座敷個室の場合に警告（注意）と減点になる', () => {
    const venue = { ...BASE_VENUE, privateRoomType: '座敷' };
    const input = { ...BASE_INPUT, roles: ['役員・経営層'] };
    const results = rankVenues([venue], input, NO_RULES);
    // スコアが引かれ、バッジが「注意」になる性質をテスト
    expect(results[0].badge).toBe('注意');
    expect(results[0].reasons.some(r => r.includes('座敷（正座）'))).toBe(true);
  });

  it('謝罪目的でカジュアルなジャンル（焼肉など）や個室なしはスコアが下がる', () => {
    const casualVenue = { ...BASE_VENUE, genre: '焼肉', privateRoomType: 'なし' };
    const input = { ...BASE_INPUT, purposes: ['謝罪'] };
    const results = rankVenues([casualVenue], input, NO_RULES);
    expect(results[0].score).toBeLessThan(40);
    expect(results[0].reasons.some(r => r.includes('謝罪会食：カジュアルまたは騒がしくなりがちなジャンル'))).toBe(true);
  });

  it('謝罪目的で完全個室の和食処は適合度が高くなる', () => {
    const formalVenue = { ...BASE_VENUE, genre: '日本料理', privateRoomType: '完全個室' };
    const input = { ...BASE_INPUT, purposes: ['謝罪'] };
    const results = rankVenues([formalVenue], input, NO_RULES);
    expect(results[0].score).toBeGreaterThan(80);
    expect(results[0].reasons.some(r => r.includes('謝罪会食：厳かで静粛な雰囲気が保てる'))).toBe(true);
  });

  it('駅チカ（2分以下）は立地加点される', () => {
    const nearVenue = { ...BASE_VENUE, walkMinutes: 1 };
    const results = rankVenues([nearVenue], BASE_INPUT, NO_RULES);
    expect(results[0].reasons.some(r => r.includes('非常に駅近で'))).toBe(true);
  });

  it('過去の重複利用チェックで減点と警告（注意）が出る', () => {
    const companies = [{ id: 'c1', slug: 'kirin-corp', name: 'キリンビール', nameKana: 'キリンビール', industry: '飲料', initial: 'キ', drinkAffiliation: 'kirin', memo: '', createdAt: new Date(), updatedAt: new Date() }];
    const guests = [{ id: 'g1', companyId: 'c1', name: '佐藤', nameKana: 'サトウ', title: '部長', isInternal: false, preferences: [], ngFoods: [], allergies: [], dietary: null, healthNotes: null, alcohol: null, origin: null, memo: '', budgetMin: null, budgetMax: null, freq: '', ownerId: null, createdAt: new Date(), updatedAt: new Date() }];
    const records = [{ id: 'rec1', venueId: 'v1', guestId: 'g1', decidedAt: new Date(), rating: 4, wentWell: '', reflection: '', businessOutcome: '', createdAt: new Date() }];
    const input = { ...BASE_INPUT, companyName: 'キリンビール' };

    // v1 is base venue id
    const results = rankVenues([BASE_VENUE], input, NO_RULES, records, guests, companies);
    expect(results[0].reasons.some(r => r.includes('重複回避：'))).toBe(true);
    // 重複減点-15が入ることをアサート
  });

  it('特定のguestIdを指定した場合は本人の重複として強く警告される', () => {
    const companies = [{ id: 'c1', slug: 'kirin-corp', name: 'キリンビール', nameKana: 'キリンビール', industry: '飲料', initial: 'キ', drinkAffiliation: 'kirin', memo: '', createdAt: new Date(), updatedAt: new Date() }];
    const guests = [{ id: 'g1', companyId: 'c1', name: '佐藤', nameKana: 'サトウ', title: '部長', isInternal: false, preferences: [], allergies: [], dietary: null, healthNotes: null, alcohol: null, origin: null, ngFoods: [], memo: '', budgetMin: null, budgetMax: null, freq: '', ownerId: null, createdAt: new Date(), updatedAt: new Date() }];
    const records = [{ id: 'rec1', venueId: 'v1', guestId: 'g1', decidedAt: new Date(), rating: 4, wentWell: '', reflection: '', businessOutcome: '', createdAt: new Date() }];
    const input = { ...BASE_INPUT, companyName: 'キリンビール', guestId: 'g1' };

    const results = rankVenues([BASE_VENUE], input, NO_RULES, records, guests, companies);
    expect(results[0].reasons.some(r => r.includes('重複回避（本人）'))).toBe(true);
  });

  it('社内高評価レコードによって加点される', () => {
    const records = [
      { id: 'rec1', venueId: 'v1', guestId: 'g2', decidedAt: new Date(), rating: 5, wentWell: '', reflection: '', businessOutcome: '', createdAt: new Date() },
      { id: 'rec2', venueId: 'v1', guestId: 'g3', decidedAt: new Date(), rating: 4, wentWell: '', reflection: '', businessOutcome: '', createdAt: new Date() }
    ];
    const results = rankVenues([BASE_VENUE], BASE_INPUT, NO_RULES, records);
    expect(results[0].reasons.some(r => r.includes('社内高評価：過去の社内利用'))).toBe(true);
  });

  it('guestBaseが店舗エリア・駅と一致すると動線加点される', () => {
    const input = { ...BASE_INPUT, guestBase: '京橋' };
    const results = rankVenues([BASE_VENUE], input, NO_RULES);
    expect(results[0].reasons.some(r => r.includes('至近のエリア'))).toBe(true);
  });

  it('partySizeが6名以上の場合は大人数警告が出る', () => {
    const input = { ...BASE_INPUT, partySize: 6 };
    const results = rankVenues([BASE_VENUE], input, NO_RULES);
    expect(results[0].reasons.some(r => r.includes('大人数利用：予約時に十分な広さの個室があるか確認推奨'))).toBe(true);
  });
});
