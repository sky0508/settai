export type SearchInput = {
  area: string;
  roles: string[];       // 役職チップ
  purposes: string[];    // 目的チップ
  genres: string[];      // ジャンルチップ
  budgetMin: number;
  budgetMax: number;
  privateRoom: boolean;
  quietRoom: boolean;
  partySize?: number;    // 参加人数
  guestBase?: string;    // 相手の拠点（動線考慮）
  companyName: string;   // 相手企業名（brand_rules 突合）
  guestId?: string;      // ゲスト指定（パーソナライズ、重複回避）
  beerExclude: {
    mode: 'exclude' | 'keep';
    makers: string[];
  };
  ngFoods?: string[];
  favoritesOnly?: boolean; // お気に入り絞り込み
  keyword?: string; // フリーワード検索
};

export type RankedVenue = {
  id: string;
  slug: string;
  name: string;
  genre: string;
  area: string;
  address: string;
  nearestStation: string;
  walkMinutes: number;
  budgetMin: number;
  budgetMax: number;
  photoUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  formalityGrade: string;
  privateRoomType: string;
  privateRoomNote: string | null;
  beerAffiliation: string;
  beerConfidence: string;
  tags: string[];
  requiresReservation: boolean;
  curationNote: string | null;
  isFavorite?: boolean; // お気に入り状態
  // スコアリング結果
  score: number;
  badge: 'OK' | '注意' | 'NG';
  reasons: string[];
  bars: { label: string; val: number }[];
};

// 格式バンド
export type FormalityBand = 'S' | 'A' | 'B';

// 役職から要求格式バンドへのマッピング
export const ROLE_FORMALITY: Record<string, FormalityBand> = {
  '役員・経営層': 'S',
  '部長': 'A',
  '課長': 'B',
};

// 予算から格式バンドへの自動写像
export function budgetToFormality(budgetMax: number): FormalityBand {
  if (budgetMax >= 12000) return 'S';
  if (budgetMax >= 8000) return 'A';
  return 'B';
}
