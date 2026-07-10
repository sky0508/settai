# 会食ナビ — TODO

> リポ一本化（2026-07-10, `sky0508/settai` に統合）後の残タスク。
> 現況の詳細は [`status.md`](./status.md)、セットアップ手順は [`SORA-SETUP.md`](./SORA-SETUP.md) が正。

---

## 🔴 セキュリティ（最優先・他より先に）

- [ ] **Neon 本番キーをローテする**
  - 理由: 生の接続文字列 `npg_AHBaiIeq30xS@ep-silent-sea-...` が旧 okinawa repo の git 履歴（GitHub push 済 commit `c02e2a8`）に残存＝**漏洩状態**。
  - 手順: Neon Console → プロジェクト（DB `neondb` / ホスト `ep-silent-sea-aotovmx5...`）→ ロール `neondb_owner` → **Reset password** → 新しい**Pooled**接続文字列（`-pooler` 入り）をコピー。
  - 貼り先: `web/.env` の `DATABASE_URL='...'`（シングルクォートで囲む）。
  - 詳細: `SORA-SETUP.md` 段階1 Step1〜2。

---

## 🟡 ローカル復帰（キーローテ後）

- [x] `cd web && npm install` ＋ `npm run build` 通過確認（2026-07-10 Claude 実施・全ルート OK）
- [ ] `npm run dev` で `localhost:3000` 起動確認（`/map` に 57 ピン、`/venues/<id>` で写真表示）← **新 DATABASE_URL 投入後**
- [ ] 必要なら seed 再投入: `npx tsx scripts/seed.ts` →（座標）`backfill-venue-coords.ts` →（写真）`backfill-venue-photos.ts`
  - ※ 実 DB は Neon に seed 済みのため、通常は再投入不要

---

## 🟢 リポ整理（Sora の判断待ち）

- [x] **統合 commit を GitHub に push**（2026-07-10 済み `21e78df`・Sora 許可）
- [ ] **旧 `sk2410yu/okinawa-2026-be-v1` の GitHub repo を archive / 削除するか判断**
  - 漏洩履歴が残るため、**キーローテ後の削除を推奨**
- [ ] `05_archives/settai-okinawa-impl-backup/`（旧 impl のバックアップ）を、統合に問題ないと確認できたら削除
- [ ] 統合判断の最終確認（下記「確認事項」）に問題なければクローズ

### 確認事項（推奨で進めた3点・違えば戻す）
- [ ] **git 履歴**: 新規スタート（漏洩回避優先／失うのは okinawa 4 コミット分のみ）で OK か
- [ ] **配置**: ルート直下 `web/` で OK か
- [ ] **venues.seed.json**: impl版28店（enriched）を採用＝旧 settai版のみの **2店（京橋たけ本・八重洲大飯店）** はバックアップに温存。要るなら戻す

---

## 🔵 デプロイ・機能（キーローテ後の本開発）

- [ ] 本番 Vercel デプロイ（`web/vercel.json` あり・region `nrt1`）
- [ ] 暗黙知9軸ヒアリングで `rule-engine` の重みを確定（現状は仮値）
- [ ] `docs/db-schema.md` と実コードのリコンサイル（`formalityGrade` 列直持ち vs docs の「格式=予算導出・formality_grade 廃止」が逆）
- [ ] 店舗詳細ページ中段の空白ボックス調査
