# 接待ナビ（settai-navi）

接待の店選び支援ツール。相手企業ごとの制約（例: キリン → 競合ビール専売の店は NG）と、新人のセンス不足による失礼を、**NG 理由付きのおすすめランキング**で防ぐ。接待記録を評価・シチュエーション付きで蓄積し、社内ナレッジ基盤へ育てる。

> 位置づけ: 将来 SaaS 化を見据えた売り物候補。ただし v1 は「外部 API ゼロ・手キュレーション・確定的ルール」で核仮説を検証する thin slice。

## 現在のフェーズ

**要件精緻化フェーズ（Phase 0.5）** — 判定ロジックの中核（店選びの暗黙知）を言語化中。詳細は [`status.md`](./status.md)。

## ドキュメント地図

| ドキュメント | 内容 |
|---|---|
| [`status.md`](./status.md) | 現況・次アクション・**暗黙知9軸（A〜I）**・セッションログ |
| [`docs/spec.md`](./docs/spec.md) | 要件定義（何を・なぜ） |
| [`docs/design.md`](./docs/design.md) | 設計仕様（構成・データモデル・判定ロジック・UI） |
| [`docs/research/settai-venue-selection-research.md`](./docs/research/settai-venue-selection-research.md) | 接待の店選びリサーチ（9軸マッピング・ヒアリング設問への反映提案） |
| [`docs/feedback-20260708.md`](./docs/feedback-20260708.md) | 忖度なしレビュー |
| [`design/ui-spec.md`](./design/ui-spec.md) | UI 仕様書（実装手渡し用） |
| [`design/mockimage/`](./design/mockimage/) | UI モック（desktop / mobile / パターン比較 A〜D） |
| [`data/schema.ts`](./data/schema.ts) | Venue / BrandRule / DiningRecord の TS 型 |
| [`data/brand-rules.seed.json`](./data/brand-rules.seed.json) | ビール4社の競合ルール seed |

## 判定の骨格（9軸）

A. 格式の釣り合い ／ B. 個室の"質" ／ C. 接待オペ適性（黒子力）／ D. 立地・動線 ／ E. 料理・酒 × 相手適合 ／ F. シーン適合 ／ G. 相手企業・業界タブー ／ H. 予約の堅牢性 ／ I. 粋・加点

高価値な軸（A / B / C / I）ほど Google Places に構造化データが無く、人手タグ・相手プロフィール・社内記録でしか埋まらない（＝ moat）。
