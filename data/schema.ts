// settai-navi — 店DB / 会社ルールの型（単一ソース）
// 2026-07-08 ブレスト確定。詳細根拠は docs/design.md §4.A。
// 検証 v1 は外部依存ゼロの型付き TS seed。records を足す時に Neon(Drizzle) へ昇格しても型は不変。

// ─────────────────────────────────────────────
// enum（文字列リテラル union で表現。DB化時は pgEnum に対応）
// ─────────────────────────────────────────────

/** A軸 格式グレード。S=料亭・高級店 / A=きちんとした個室店 / B=カジュアル */
export type FormalityGrade = 'S' | 'A' | 'B';

/** B軸 個室の"質"。有無でなく質を持つ */
export type PrivateRoomType = '完全個室' | '半個室' | '座敷' | 'なし';

/** G軸 ビール系統（競合タブー判定用） */
export type BeerAffiliation =
  | 'kirin'
  | 'asahi'
  | 'suntory'
  | 'sapporo'
  | 'mixed'   // 複数系統を扱う
  | 'unknown'; // 不明（不明として扱い、NG確定はしない = 安全側）

/** 系統タグの確信度。unknown は UI で「注意」に落とす */
export type BeerConfidence = 'confirmed' | 'estimated' | 'unknown';

// ─────────────────────────────────────────────
// venues（店DB）
// ─────────────────────────────────────────────

export interface Venue {
  // --- 基本情報（母集団収集で自動でも埋まる） ---
  id: string;              // uuid
  slug: string;            // seed 冪等化キー（UNIQUE）
  name: string;
  genre: string;           // ジャンル（E軸。NG食材マッチの土台）
  area: string;            // エリア（例「京橋」）
  address: string;
  nearestStation: string;  // 最寄駅（D軸 動線）
  walkMinutes: number;     // 駅徒歩分（D軸）
  budgetMin: number;       // 円/人・夜（予算軸下限）
  budgetMax: number;       // 円/人・夜（予算軸上限）
  photoUrl?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;

  // --- 暗黙知タグ（最終~25店だけ人手。moat の素） ---
  formalityGrade: FormalityGrade;        // A軸 格式（最重要）
  privateRoomType: PrivateRoomType;      // B軸 個室の質
  privateRoomNote?: string | null;       // 密談可/防音/眺望/椅子か掘りごたつ 等
  beerAffiliation: BeerAffiliation;      // G軸 競合タブー
  beerConfidence: BeerConfidence;        // 確信度
  beerSourceUrl?: string | null;         // 系統の根拠URL
  tags: string[];                        // F軸シーン/I軸粋/酒の強み を柔軟に
  requiresReservation: boolean;          // H軸予約

  // --- メタ ---
  curationNote?: string | null;          // 手キュレーションの勘所
  source: string;                        // データ出所
  // createdAt / updatedAt は DB化時に付与
}

// ─────────────────────────────────────────────
// brand_rules（会社ルール = v1 はビール）
// ─────────────────────────────────────────────

export interface BrandRule {
  id: string;                          // uuid
  company: string;                     // 相手企業名（例「キリン」）
  affiliation: BeerAffiliation;        // venues.beerAffiliation と一致
  effect: 'ng' | 'prefer';             // 競合=ng / 自社=prefer
  label: string;                       // 表示用（例「アサヒ系」）
}

// ─────────────────────────────────────────────
// records（最小・scope B 選択時のみ。書き込み発生 → Neon 昇格）
// ─────────────────────────────────────────────

export interface DiningRecord {
  id: string;
  venueId: string;
  decidedAt: string;      // ISO
  rating?: number | null; // 1..5
  note?: string | null;
}
