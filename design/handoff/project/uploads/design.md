# 接待ナビ（settai-navi） — 設計仕様書（design）

> 「どう動くか（設計）」を定義する。前提は `spec.md`。実装タスクの分解は `plan.md`。

> **⚠️ この設計書は2層構成**（2026-07-08 改訂）:
> - **【検証 v1】= 今作る**。外部 API ゼロ・手キュレーション・確定的ルールのみ。§1.A / §4.A が実装対象。
> - **【拡大】= 3ゲート通過後**（`spec.md` §8）。Places 連携・自動 enrichment・パーソナライズ。§2 の 4段パイプラインや §3 のフル判定ロジックは **拡大フェーズの到達目標** として残す（検証 v1 では段1・段3を人手で fake する）。

## 1. システム構成

### 1.A 検証 v1（今作る）

```
[ブラウザ / Next.js UI]
        │  探索リクエスト（相手企業・相手・条件）
        ▼
[App Router / Server Actions]
        │
        ├─▶ ルールエンジン ──── 事前フィルタ + 4軸スコアリング（純関数・確定的）
        └─▶ Neon(Postgres)/Drizzle ── venues（手キュレーション seed）/ brand_rules（+最小 records）
```

- **外部 API なし**。店データは手キュレーション seed、ビール系統・格式は手タグ。コスト≒0。
- 探索は「seed から絞り込み → 4軸スコア → 理由付きランキング」。§2 段1（Places 取得）と段3（自動 enrichment）は **seed の手タグで代替**（＝コンシェルジュ型 MVP）。

### 1.B 拡大（3ゲート通過後）

```
        ├─▶ Google Places API ── 候補取得（Text Search + Details）
        ├─▶ enrichment ─────── 競合ルール発火時のみ、AI + Web検索
        └─▶ guests / records ── パーソナライズ・社内ナレッジのスコア反映
```

### 共通スタック

- フレームワーク: Next.js 16（App Router）+ Tailwind
- DB: Neon（Serverless HTTP + lazy Proxy）+ Drizzle ORM
- 認証: v1 は無し or ベタ1本（本格 iron-session は拡大フェーズ）
- 外部: 【拡大のみ】Google Places API（店データ）、LLM（enrichment、サーバ側 Claude 呼び出し）
- 配置: `02_projects/settai-navi/web/`（独立 git repo）。既存 `yakin-checkin/web`・`saimu/web` のパターンを流用（→ §9 流用元マップ）。

## 2. 探索パイプライン（4段）

探索リクエストを受けてから結果を返すまでの流れ。

### 段1: 候補取得
- Google Places Text Search に `エリア × ジャンル × 予算 × 個室希望` を投げ、15〜30件を得る。
- 各店の Place Details（価格帯・座標・評価・営業情報）を取得し `venues` にキャッシュ（place_id 一致で再利用）。

### 段2: ルールベース事前フィルタ（安価・確定的）
- 予算レンジ外 / エリア外 / 個室なし（個室希望時）/ 格式不足 / NG食材ジャンル を足切り。
- 目的は enrichment に渡す候補を **10件前後に圧縮**すること（コスト抑制）。

### 段3: 競合 enrichment（条件付き・重い）
- **発火条件**: 相手企業がメーカーで競合ルールが有効なときのみ。非メーカーなら段3を丸ごとスキップ。
- 通過した少数店だけを対象に、AI が Web検索（`店名 + エリア + 生ビール銘柄/アサヒ/キリン` 等）で取扱ビール系統を推定。
- 出力: `系統（例: キリン系 / アサヒ系 / 混在 / 不明）` + `確信度（確実 / 推定 / 不明）` + `根拠URL`。
- 結果を `venue_beverages` にキャッシュ（調査日つき、一定期間で再調査）。

### 段4: スコアリング＆提示
- 各店に適合スコア（0–100）と `OK / 注意 / NG` バッジを付与。
- 理由文を3系統から合成し、NG はランキング下部に残す。

## 3. 判定ロジック（スコアリング）

適合スコアは3系統の加減点を合成する。バッジは競合ルールと総合スコアで決定。

### 3.1 ルール根拠（確定的）
| 軸 | 判定 | 効果 |
|---|---|---|
| 競合製品 | 競合ブランドを主力に出す（確実） | NG（強い減点、下部固定） |
| 競合製品 | 自社ブランドを扱う（確実） | 加点 |
| 競合製品 | 系統不明 | 「注意」バッジ + 予約時要確認 |
| 格式 | 手タグ格式グレード（S/A/B）が相手役職に釣り合う | 加点 / 不足は減点 |
| 予算 | 1人予算に収まる | 加点、外れは減点 |
| NG食材 | 相手のNG食材が中心ジャンル | 減点 + 警告 |

> **格式判定は v1 で確定（Places 近似はしない）**: venues に手タグの `formality_grade`（S=料亭・高級店 / A=きちんとした個室店 / B=カジュアル）を持たせ、相手役職の要求グレードと突き合わせる。一番難しく価値の高い軸を初日から確定的に機能させる。Places の price_level・rating による近似は拡大フェーズでデータをスケールする時に検討。

### 3.2 パーソナライズ根拠（相手プロフィール・履歴）
- 相手の好み（例: 日本酒好き）に合致 → 加点。
- 同じ相手に前回行った店 → **重複回避**で下げる（履歴参照）。

### 3.3 社内ナレッジ根拠（接待記録）
- 過去に高評価★だった店 → 加点。
- 同じシチュエーション（役職・目的）で使われ好評だった店 → 加点し、理由に「社内実績」を表示。

### 3.4 バッジ決定
- `NG`: 競合専売が確実、または致命的なNG食材ヒット。
- `注意`: 系統不明 / 予算ギリ / 献立相談が必要。
- `OK`: 上記に該当せず総合スコアが閾値以上。

## 4. データモデル（Neon + Drizzle）

将来のマルチテナント化に備え、主要テーブルに `tenant_id`（v1 は固定値）を持たせる余地を残す。**検証 v1 は空箱を作らない**（work-os 設計原則）ため、必要最小限のみ建てる。

### 4.A 検証 v1（今作る）

| テーブル | 主なカラム | 役割 |
|---|---|---|
| `venues` | id, name, address, genre, formality_grade(S/A/B), budget_band, has_private_room, beer_affiliation, beer_confidence | **手キュレーション seed**。Places 由来カラム(place_id/lat/lng/rating)は拡大時に追加 |
| `brand_rules` | id, company_id, brand, kind(own/rival), effect(ng/prefer) | 企業↔ブランド。ビール4社を seed。ユーザー追加ルールもここに統合（旧 user_rules を吸収） |
| `records`（最小） | id, venue_id, decided_at, rating?, note? | **記録行動の需要検証用**。「決めた／後で評価」だけを最小保存。guest 紐付けやシチュエーションは持たない |

- `companies` は v1 では brand_rules 内の企業名で足りるため独立テーブルにしない（必要になったら切り出す）。
- ビール系統・確信度・格式は seed に手タグで直接持つ（別テーブル `venue_beverages` は拡大時）。

### 4.B 拡大（3ゲート通過後）

| テーブル | 役割 |
|---|---|
| `companies` | 相手企業マスタ（industry, is_maker） |
| `venue_beverages` | 自動 enrichment キャッシュ（affiliation, confidence, source_url, checked_at） |
| `guests` | 接待相手プロフィール（title, preferences, ng_foods, memo） |
| `settai_records` | 接待履歴＝ナレッジ源（guest_id, situation, share_scope 等をフル装備。v1 の最小 records を拡張） |
| `recommendations` | 提示ログ（学習用） |

- `preferences` / `ng_foods` は正規化しすぎず配列 or JSON で保持。
- `situation` は役職・目的・シーンのタグ集合。

## 5. UI 設計

合意済みモック（`探索フォーム → 理由付きランキング`）を基準とする。

### 5.1 画面
1. **探索画面**（メイン）
   - 上部: 探索フォーム（相手企業 / **相手役職** / **会の目的** / **相手拠点** / エリア / 人数・個室 / 予算 / 相手＝記録から呼び出しチップ）
     - ※ 役職・目的・拠点は 9軸の A(格式)・B(個室の質)・F(シーン)・D(動線) 判定に必須（spec §5.1）。
   - 「おすすめを出す」実行
   - 下部: 結果ランキング（店カードの縦並び）
2. **接待相手管理**（一覧 + 編集）: 好み・NG食材・役職・メモ
3. **接待記録**（探索結果 or 履歴から登録）: 評価★・シチュエーション・良かった点

### 5.2 店カードの構成（1枚）
- 店名 ＋ ジャンル / エリア・徒歩分
- 右肩: `OK / 注意 / NG` バッジ ＋ 適合スコア（色: OK=緑, 注意=琥珀, NG=赤）
- メタ行のバッジ: `ビール系統 ・ 確信度` / `個室` / `予算`
- 理由行（アイコン付き、複数）:
  - ルール根拠（例: 一番搾り取扱い→キリン接待に適合 / アサヒ専売→競合）
  - パーソナライズ（例: 日本酒15種→好みに合致 / 昨年10月に利用済み→重複回避）

### 5.3 状態・エッジケース
- 相手が非メーカー: ビール系統バッジは非表示、段3スキップ。
- 系統不明の店: 「注意」＋「予約時に要確認」。
- 候補ゼロ: 条件緩和のサジェスト（予算 or エリアを広げる）。

## 6. 外部連携の設計

### 6.1 Google Places
- `lib/google-places.ts`: Text Search / Place Details ラッパ。`venues` に place_id でキャッシュし、二重課金を避ける。
- 価格帯（price_level）→ 予算・格式判定に使用。

### 6.2 enrichment（LLM + Web検索）
- `lib/beverage-enrichment.ts`: 入力（店名・住所）→ Web検索 → 系統・確信度・根拠URL。
- 冪等: `venue_beverages` に `checked_at` を持ち、一定期間内は再利用。
- 失敗時は「不明」で確定させ、UI は「注意」に落とす（安全側）。

## 7. 非機能・運用

- Places / LLM のコストは段2フィルタで対象を絞ることで抑制。
- テスト: フィルタ・スコアリング・enrichment判定を Vitest でユニット化（外部呼び出しはモック）。
- ログ: `recommendations` に入力と結果を残し、将来の精度改善の土台にする。

## 8. 設計上のオープン論点

- 【拡大】格式スコアの近似式（price_level・rating・genre の重み）。Places 導入時に手タグ実績と突き合わせて調整。※検証 v1 は手タグ S/A/B で確定済み。
- 【拡大】enrichment の情報源優先度（**公式サイト・一次情報 > 口コミ文**。食べログのスクレイピングは ToS 違反・訴訟リスクのため源に含めない）。
- 【拡大】`preferences` の表現（自由テキスト＋タグ or 構造化）。まずは軽量に。

## 9. 実装の流用元マップ（既存プロジェクトから）

検証 v1（単一ユーザー認証 or 無し / 手キュレーション JSON seed / 4軸ルールエンジン）の土台は既存2プロジェクトからほぼ流用できる。実装フェーズ（3ゲート通過後に plan.md 詳細化）で参照:

| 作るもの | 流用元 | 具体ファイル・要点 |
|---|---|---|
| 単一ユーザー認証（使う場合） | **saimu/web** | `src/lib/password.ts`（PBKDF2, DB不要）+ `src/lib/session.ts`（iron-session）+ `src/app/login/actions.ts`（env `AUTH_PASSWORD_HASH` 照合）+ `src/proxy.ts`（middleware ガード）。DBユーザーテーブル不要 |
| build-safe な Neon 接続 | **yakin-checkin/web** | `src/lib/db/client.ts`（`new Proxy` で接続を lazy 化、build 時 `DATABASE_URL` 未設定でも落ちない）+ schema を `src/lib/db/schema.ts` に配置 |
| 手キュレーション JSON seed | **yakin-checkin/web** | `scripts/seed.ts`（zod で JSON 検証・slug 重複 skip の冪等 seed・`tsx` 実行）+ `seed.config.example.json`（cp して実データ化）。settai-navi の店データ seed はこれを丸写し |
| 4軸ルールエンジン | **saimu/web** | `src/lib/repayment.ts` + `repayment.test.ts` の「純関数 + `@/lib/types` 入出力 + colocated vitest」パターン。フォルダ分割したい場合のみ yakin `alert-engine/` のレイアウトを参照（中身は純関数に） |
| env | **saimu/web** | `.env.local.example`（`DATABASE_URL` / `SESSION_SECRET` / `AUTH_PASSWORD_HASH` / `NEXT_PUBLIC_APP_URL`）がほぼそのまま |

> 共通教訓: **認証ガードを layout に置くと login が redirect loop**。middleware（saimu `proxy.ts`）か page/API 関数（yakin `require-admin.ts`）に置く。
