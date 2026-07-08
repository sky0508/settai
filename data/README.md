# settai-navi / data — 検証 v1 の店DB seed

スコープ = 探索だけ（`venues` + `brand_rules`）。ストレージは型付き TS seed（DB無し）で開始。
型・スコープの根拠は `../docs/design.md §4.A` と承認 plan（`~/.claude/plans/serene-swimming-cupcake.md`）。

## ファイル

| ファイル | 役割 |
|---|---|
| `schema.ts` | **型の単一ソース**（`Venue` / `BrandRule` / `DiningRecord`）。DB化する時はこの型を Drizzle schema に写す |
| `venues.seed.json` | 京橋・八重洲・日本橋の接待向け店 30 件（2026-07-08 収集）|
| `brand-rules.seed.json` | ビール4社の競合ルール 16 行（キリン/アサヒ/サントリー/サッポロ × own=prefer / 競合=ng）|

## venues の内訳（30件）
- 格式: S=5 / A=18 / B=7
- エリア: 京橋10 / 八重洲7 / 日本橋13
- 個室: 完全個室18 / 半個室8 / 座敷1 / なし3
- 予算: 7,800〜36,300円/人（夜コース）

## ⚠️ ビール系統は要注意（安全側で埋めてある）
- `beerConfidence` は **30件中 confirmed=1・unknown=29**。公式サイトから提供ビール銘柄を確実に特定できる店はほぼ無い。
- これは spec §8-2「enrichment 再現性ゲート（確実率≥40%）」を**現状の手法ではクリアできない**ことを示す実データ。ビール自動化を本採用する前に手法（一次情報源）を再検討する材料。
- 設計思想どおり **unknown は NG 確定せず「注意」に落とす**（誤って競合店を弾かない安全側）。

## 手タグの校正について（暗黙知ヒアリング後）
`formalityGrade`（格式 S/A/B）・`privateRoomType`（個室の質）は公式情報＋業態からの**推定**。
センスの良い社員への暗黙知ヒアリング（status.md 参照）で校正する前提。特に格式の付け方は要レビュー。

## 更新方法
- 店の追加: `venues.seed.json` に `schema.ts` の `Venue` 準拠で追記（`slug` は一意）。
- 検証: `docs/design.md` の列定義が正。web/ 実装時は yakin-checkin `scripts/seed.ts`（zod + slug重複skip）を流用して読み込む。
