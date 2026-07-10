# 会食ナビ（settai-navi） — 設計仕様書（design）

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
| 競合製品（自動・主） | 相手企業→brand_rules で競合系統を主力（確実） | NG（強い減点、下部固定） |
| 競合製品（自動・主） | 相手企業→brand_rules で自社系統を扱う（確実） | 加点 |
| 競合製品（自動・主） | 系統不明 | 「注意」バッジ + 予約時要確認 |
| 競合製品（手動・補助） | UI ポップアップで除外指定されたメーカー | フィルタ除外（相手企業不明/上書き時のフォールバック） |
| 格式 | **予算・役職から自動導出**した要求バンドに釣り合う | バンド一致=加点 / 下回り=大減点 / 上回りすぎ=減点（恐縮） |
| 予算 | 1人予算に収まる | 加点、外れは減点 |
| NG食材 | 相手のNG食材が中心ジャンル | 減点 + 警告 |

> **格式は自動判定に更新（2026-07-08・`db-schema.md` 準拠）**: 旧「手タグ `formality_grade` S/A/B で確定」から変更。既定は `formality = f(budget_max)` を `budget_bench`（B:〜8k / A:8–12k / S:12–15k）で S/A/B に写像し、`role_purpose_matrix`（役職×目的→要求バンド）と突合。手タグ `formality_grade` は **単価と体感がズレた店だけの例外 override**（nullable, 既定空）。UI は「格式：A（予算・役職から自動判定）」ピルで表示。理由: 単価は公式サイトから自動取得でき seed の手作業を大幅削減でき、「格式≒価格帯」は実務近似として十分。外れが目立てば代理指標（創業年/受賞）で導出式を精緻化【拡大】。

### 3.2 パーソナライズ根拠（相手プロフィール・履歴）
- 相手の好み（例: 日本酒好き）に合致 → 加点。
- 同じ相手に前回行った店 → **重複回避**で下げる（履歴参照）。

### 3.3 社内ナレッジ根拠（会食記録）
- 過去に高評価★だった店 → 加点。
- 同じシチュエーション（役職・目的）で使われ好評だった店 → 加点し、理由に「社内実績」を表示。

### 3.4 バッジ決定
- `NG`: 競合専売が確実、または致命的なNG食材ヒット。
- `注意`: 系統不明 / 予算ギリ / 献立相談が必要。
- `OK`: 上記に該当せず総合スコアが閾値以上。

## 4. データモデル（Neon + Drizzle）

将来のマルチテナント化に備え、主要テーブルに `tenant_id`（v1 は固定値）を持たせる余地を残す。**検証 v1 は空箱を作らない**（work-os 設計原則）ため、必要最小限のみ建てる。

### 4.A 検証 v1（今作る）

> 2026-07-08 ブレストで venues の型を確定（9軸マッピング根拠つき）。スコープ = **探索だけ**（venues + brand_rules）。ストレージは読み取りのみのため **型付き TS seed（DB無し）で開始**し、記録(records)を足す時に Neon へ昇格（型は不変）。

**`venues`** — 手キュレーション seed。各列に 9軸マッピングを併記。

基本情報（母集団収集で自動でも埋まる）:
| カラム | 型 | 用途 / 9軸 |
|---|---|---|
| `id` | uuid PK | — |
| `slug` | text UNIQUE | seed 冪等化（重複skip）|
| `name` | text | 店名 |
| `genre` | text | ジャンル（E軸。NG食材マッチの土台）|
| `area` | text | エリア（例「京橋」）|
| `address` | text | 住所 |
| `nearest_station` | text | 最寄駅（D軸 動線）|
| `walk_minutes` | int | 駅徒歩分（D軸）|
| `budget_min` / `budget_max` | int（円/人・夜）| 予算軸。「2万〜に収まるか」を確定判定 |
| `photo_url` / `website_url` / `phone` | text NULL | 表示・一次情報源・予約メモ |

暗黙知タグ（最終~25店だけ人手。moat の素）:
| カラム | 型 | 用途 / 9軸 |
|---|---|---|
| `formality_grade` | enum `S`/`A`/`B` | **A軸 格式**（最重要）。相手役職の要求グレードと突合 |
| `private_room_type` | enum `完全個室`/`半個室`/`座敷`/`なし` | **B軸 個室の"質"**（有無でなく質）|
| `private_room_note` | text NULL | 密談可/防音/眺望/椅子か掘りごたつ 等 |
| `beer_affiliation` | enum `kirin`/`asahi`/`suntory`/`sapporo`/`mixed`/`unknown` | **G軸 競合タブー**。brand_rules と join |
| `beer_confidence` | enum `confirmed`/`estimated`/`unknown` | 確信度（不明を不明として安全側に）|
| `beer_source_url` | text NULL | 系統の根拠URL |
| `tags` | text[]（jsonb可）| **F軸シーン**（静か/華やか/隠れ家）・**I軸粋**（予約困難/名店/眺望）・酒の強み。正規化しすぎない |
| `requires_reservation` | bool | H軸予約 |
| `curation_note` | text NULL | 手キュレーションの勘所メモ |

メタ: `source` / `created_at` / `updated_at`。

**意図的に持たせない**（理由つき）:
- `tenant_id` → v1 単一。拡大時に1列追加（空箱を作らない）。
- `lat`/`lng`/`place_id`/`rating` → Places 由来。拡大フェーズ。
- 役職→要求格式の対応 → **判定ロジック**であって店属性でない。ルールエンジン側（暗黙知ヒアリング後）。
- NG食材の精密マッチ → guests 待ち。v1 は `genre`+`tags` で近似。

**`brand_rules`** — v1 の唯一のインスタンス＝ビール。venues.beer_affiliation と直結する形に単純化:
| カラム | 型 | 例 |
|---|---|---|
| `id` | uuid PK | — |
| `company` | text | `キリン`（相手企業名。companies テーブルは v1 不要）|
| `affiliation` | text | `asahi`（venues.beer_affiliation と一致）|
| `effect` | enum `ng`/`prefer` | 競合=`ng` / 自社=`prefer` |
| `label` | text | 表示用（例「アサヒ系」）|

- seed: ビール4社。各社 own→prefer / 競合3社→ng を展開。
- 判定: `相手企業 = brand_rules.company` ∧ `venues.beer_affiliation = brand_rules.affiliation` で join → effect 適用。`beer_confidence=confirmed` の時だけ NG 確定、`unknown` は「注意」。
- 汎用フレーム（相手企業ごとの地雷）への一般化は拡大時。v1 はビール具体で joinable に。

**`records`（v1 軽量記録）** — id, venue_id, decided_at, rating?, went_well?, reflection?, business_outcome?（`商談前進 / 関係深化 / 次アポ獲得 / 特になし`）。「決めた／後で評価」の最小＋業務成果まで保存（capture 需要の検証用）。**v1 ではスコアへ反映しない**（溜めるだけ）。`guest_id` 紐付け・`situation`・`share_scope`・集計ビュー・スコア反映は【拡大】（`db-schema.md` の `settai_records` フル型へ拡張）。入れると書き込み発生 → Neon 昇格。

- `companies` は v1 では brand_rules 内の企業名で足りるため独立テーブルにしない（必要になったら切り出す）。
- ビール系統・確信度・格式は seed に手タグで直接持つ（別テーブル `venue_beverages` は拡大時）。

### 4.B 拡大（3ゲート通過後）

| テーブル | 役割 |
|---|---|
| `companies` | 相手企業マスタ（industry, is_maker） |
| `venue_beverages` | 自動 enrichment キャッシュ（affiliation, confidence, source_url, checked_at） |
| `guests` | 会食相手プロフィール（title, preferences, ng_foods, memo） |
| `settai_records` | 会食履歴＝ナレッジ源（guest_id, situation, share_scope 等をフル装備。v1 の最小 records を拡張） |
| `recommendations` | 提示ログ（学習用） |

- `preferences` / `ng_foods` は正規化しすぎず配列 or JSON で保持。
- `situation` は役職・目的・シーンのタグ集合。

## 5. UI 設計

合意済みモック（`探索フォーム → 理由付きランキング`）を基準とする。

> **UI の正 = `design/handoff/`（完成系）。実装は spec §0 のフェーズタグに従う。** 完成系 UI は 5タブ（お店を探す / ダッシュボード / ゲスト管理 / お気に入り / 設定）。以下は v1 実装対象と【拡大】を明示する。

### 5.1 画面

**【v1】探索フロー**:
1. **探索画面**（`お店を探す`＞条件から探す）
   - 左: 検索条件パネル（相手企業 / **相手役職** / **会の目的** / **相手拠点** / エリア / 人数・個室 / 予算 / ジャンル）＋ **格式：自動判定ピル** ＋ **競合ビールを除外ボタン→ポップアップ**（手動補助・二層）。
     - ※ 役職・目的・拠点は 9軸の A(格式)・B(個室の質)・F(シーン)・D(動線) 判定に必須（spec §5.1）。相手＝記録から呼び出しチップは【拡大】。
   - 右: 結果ランキング（店カードの縦並び。OK/注意/NG ＋ 適合スコア ＋ 理由文）。
2. **店舗詳細**（`店舗詳細`）: スコア内訳4軸バー / 競合ドリンク確信度 / おすすめ理由 / 予約メモ作成（spec §5.4b）。
3. **軽量記録**: 評価★ / 良かった点 / 反省 / 業務成果（決めた・後で評価）。

**【拡大】UI ビジョンにあるが v1 では作らない**:
- **ゲスト管理**（`ゲスト管理`）: 会社 → 担当者 → 会食履歴の階層。好み・NG食材・役職・メモ。＋ `お店を探す`＞ゲストから探す タブ（条件の自動プリセット）。
- **お気に入り**（`お気に入り`）: 格式別 / シーン別・チーム共有コレクション（社内ナレッジ UI）。
- **ダッシュボード**（`ダッシュボード`）: KPI ＋ 会食予定（手入力）＋ 最近の記録 ＋ よく使われる店 TOP5。

### 5.2 店カードの構成（1枚）
- 店名 ＋ ジャンル / エリア・徒歩分
- 右肩: `OK / 注意 / NG` バッジ ＋ 適合スコア（色: OK=緑, 注意=琥珀, NG=赤）
- メタ行のバッジ: `ビール系統 ・ 確信度` / `個室` / `予算`
- 理由行（アイコン付き、複数）:
  - ルール根拠（例: 一番搾り取扱い→キリン会食に適合 / アサヒ専売→競合）
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
