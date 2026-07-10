# 接待ナビ — 実装計画（plan.md）

> 前提: `spec.md`（何を・なぜ）/ `design.md`（どう動くか）/ `design/handoff/project/Settai Navi.dc.html`（UI の正）
> デプロイ先: Vercel / DB: Neon(Postgres) + Drizzle ORM / フレームワーク: Next.js 16 App Router + Tailwind

---

## 実装スコープの整理

handoff HTML には 10 画面すべてが含まれている。v1（thin slice）と拡大の境界を維持しながら、**ナビとレイアウトは全画面分作り、機能は v1 優先**で進める。

| 画面 | フェーズ | 優先度 |
|---|---|---|
| お店を探す（条件から探す）| **v1** | ★★★ |
| 店舗詳細 | **v1** | ★★★ |
| 接待を記録する | **v1** | ★★★ |
| ダッシュボード | 拡大 | ★★ |
| お気に入り | 拡大 | ★★ |
| ゲスト管理（4画面） | 拡大 | ★★ |
| 設定 | 拡大 | ★ |

---

## Phase 1 — プロジェクト Scaffold & DB 接続（Day 1 前半）

### タスク
- [ ] `web/` を Next.js 16 (App Router) で作成
  ```
  npx create-next-app@latest web --typescript --tailwind --app --src-dir
  ```
- [ ] フォント追加: `Noto Sans JP` / `Noto Serif JP` / `Material Symbols Outlined`
  - `next/font/google` 経由で `layout.tsx` に仕込む
  - Material Symbols は `<head>` に `<link>` で追加（Google Fonts CDN）
- [ ] Tailwind config にデザイントークンを追加
  ```js
  // tailwind.config.ts
  colors: {
    navy: '#1f2d47',   // 文字・見出し
    'navy-dark': '#14233f', // 最暗部
    sidebar: '#1b2c49',
    gold: '#c2a15a',   // アクセント
    'gold-dark': '#b8944a',
    cream: '#f6f3ec',  // 背景
    ok: '#2e9e5b',
    caution: '#e0aa33',
    ng: '#d95757',
  }
  ```
- [ ] Neon + Drizzle セットアップ（yakin-checkin の `src/lib/db/client.ts` パターンを流用）
  - `new Proxy` で lazy 接続 → build 時 `DATABASE_URL` 未設定でも落ちない
  - `src/lib/db/schema.ts` に Drizzle スキーマ
- [ ] `.env.local.example` 作成（`DATABASE_URL` / `SESSION_SECRET`）

### Drizzle スキーマ（`src/lib/db/schema.ts`）

```ts
// venues: data/schema.ts の Venue 型を Drizzle に写す
export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  genre: text('genre').notNull(),
  area: text('area').notNull(),
  address: text('address').notNull(),
  nearestStation: text('nearest_station'),
  walkMinutes: integer('walk_minutes'),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  photoUrl: text('photo_url'),
  websiteUrl: text('website_url'),
  phone: text('phone'),
  formalityGrade: text('formality_grade'), // S/A/B (override のみ)
  privateRoomType: text('private_room_type'), // 完全個室/半個室/座敷/なし
  privateRoomNote: text('private_room_note'),
  beerAffiliation: text('beer_affiliation'), // kirin/asahi/suntory/sapporo/mixed/unknown
  beerConfidence: text('beer_confidence'),   // confirmed/estimated/unknown
  beerSourceUrl: text('beer_source_url'),
  tags: jsonb('tags').$type<string[]>(),
  requiresReservation: boolean('requires_reservation').default(false),
  curationNote: text('curation_note'),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const brandRules = pgTable('brand_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  company: text('company').notNull(),    // 例: キリン
  affiliation: text('affiliation').notNull(), // 例: asahi
  effect: text('effect').notNull(),      // ng / prefer
  label: text('label').notNull(),
});

export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id').references(() => venues.id),
  decidedAt: timestamp('decided_at').defaultNow(),
  rating: integer('rating'),
  wentWell: text('went_well'),
  reflection: text('reflection'),
  businessOutcome: text('business_outcome'), // 商談前進/関係深化/次アポ獲得/特になし
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Seed スクリプト（`scripts/seed.ts`）

yakin-checkin の seed パターンを流用:
- `data/venues.seed.json` → venues テーブル（slug 重複 skip で冪等）
- `data/brand-rules.seed.json` → brand_rules テーブル
- 実行: `npx tsx scripts/seed.ts`

---

## Phase 2 — グローバルレイアウト & ナビゲーション（Day 1 後半）

### ファイル構成

```
src/
  app/
    layout.tsx          ← ルートレイアウト（サイドバー + メインカラム）
    page.tsx            ← /  → /search へリダイレクト
    search/page.tsx
    venues/[id]/page.tsx
    record/page.tsx
    dashboard/page.tsx
    favorites/page.tsx
    guests/page.tsx
    guests/[companyId]/page.tsx
    guests/[companyId]/[personId]/page.tsx
    guests/new/page.tsx
    settings/page.tsx
  components/
    layout/
      Sidebar.tsx        ← デスクトップ左サイドバー（width: 246px）
      MobileHeader.tsx   ← モバイル上部ヘッダー（height: 58px）
      BottomNav.tsx      ← モバイル下部タブバー（fixed）
    ui/
      Badge.tsx          ← OK/注意/NG バッジ
      Chip.tsx           ← フィルタチップ
      ScoreBar.tsx       ← スコアバー
      Toggle.tsx         ← ON/OFF トグル
```

### レスポンシブ戦略

`window.innerWidth < 900` で分岐（handoff と同じ閾値）。
- サーバーコンポーネントではデフォルト desktop → クライアントで hydration 後に補正
- `useMediaQuery` hook または CSS `@media (max-width: 899px)` で制御

### ナビ項目（5 タブ）

| key | icon | label(desktop) | label(mobile) | 遷移先 |
|---|---|---|---|---|
| search | search | お店を探す | 探す | /search |
| guest | group | ゲスト管理 | ゲスト | /guests |
| favorite | favorite | お気に入り | お気に入り | /favorites |
| settings | settings | 設定 | 設定 | /settings |
| dashboard | monitoring | ダッシュボード | 実績 | /dashboard |

アクティブタブは URL pathname で判定。

---

## Phase 3 — 探索画面（v1 コア）（Day 2〜3）

### `/search` ページ

2カラムレイアウト（デスクトップ: `300px 1fr`、モバイル: `1fr`）。

**左パネル（フィルタカード）**:
- エリア select
- ゲストの役職 chips（役員・経営層 / 部長 / 課長 / + カスタム）
- 接待の目的 chips（新規開拓 / 関係強化 / 謝罪 / 御礼 / 慰労）
- ジャンル chips（和食 / 寿司 / 鉄板焼き / フレンチ / 中華 / イタリアン / 焼肉）
- ご予算 range input（min〜max 円/人）
- 格式自動判定ピル（`background: #faf3e2` の情報表示）
- 個室あり / 防音・静かな個室 トグル
- 競合ビールを除外ボタン → 競合ビールモーダル
- 検索ボタン（金グラデ）

**競合ビールモーダル**:
- 2モード: 選択したメーカーを除外 / 選択した以外を除外
- 4社チェックボックス（キリン/アサヒ/サントリー/サッポロ）

**右エリア（結果リスト）**:
- 1位: featured カード（大きめ写真 + 理由リスト + スコアドーナツ + バー3本）
- 2位〜: compact カード（写真 + 基本情報 + スコアドーナツ + バー1本）
- 各カードクリック → `/venues/[id]`

### ルールエンジン（`src/lib/rule-engine.ts`）

純関数。`venues` seed と入力条件を受け取り `RankedVenue[]` を返す。

```ts
type SearchInput = {
  area: string;
  roles: string[];        // 役職チップ
  purposes: string[];     // 目的チップ
  genres: string[];       // ジャンルチップ
  budgetMin: number;
  budgetMax: number;
  privateRoom: boolean;
  quietRoom: boolean;
  beerExclude: { mode: 'exclude' | 'keep'; makers: string[] };
  companyName?: string;   // 相手企業名（brand_rules と突合）
};

type RankedVenue = Venue & {
  score: number;          // 0–100
  badge: 'OK' | '注意' | 'NG';
  reasons: string[];      // 理由文
  bars: { label: string; val: number }[];
};
```

4 軸スコアリング:
1. **競合製品**（brand_rules join + beer_confidence）
2. **格式**（budget_max → B/A/S バンド → 役職要求バンドと突合）
3. **予算**（budgetMin〜budgetMax が venue.budget_max 以下か）
4. **ジャンル**（genres フィルタ）

NG は除外せず `score` を下げ、`badge = 'NG'`、ランキング末尾へ。

### API Route（Server Action）

```ts
// src/app/search/actions.ts
'use server';
export async function searchVenues(input: SearchInput): Promise<RankedVenue[]>
```

---

## Phase 4 — 店舗詳細（v1）（Day 3）

### `/venues/[id]` ページ

2カラム（デスクトップ: `repeat(auto-fit, minmax(300px, 1fr))`）。

**左カラム**:
- 写真スロット（300px height）+ サムネイル5枚
- 競合ドリンク確認カード（系統バッジ + 確信度 + 注意文）
- おすすめ理由カード（自然文）

**右カラム**:
- パンくず（お店を探す > 店名）
- 店名（Noto Serif JP）+ ジャンル + 価格帯 + OK/スコアバッジ
- スコア内訳カード（格式 / 予算適合 / シーン適合 / 特別感 のバー）
- 情報行（個室 / 駅徒歩 / 要予約）
- CTA「予約メモを作成する」→ `/record?venueId=xxx`

---

## Phase 5 — 軽量記録（v1）（Day 4 前半）

### `/record` ページ

`venueId` クエリパラメータで初期値プリセット。

フォーム:
- お店 / 日付 / ゲスト / 同席者 （行ラベル + フィールド）
- 総合評価（★5段）
- 良かった点チップ（料理 / 個室 / サービス / 話題 / 店の格）
- 反省点・申し送り textarea
- 業務成果 セグメント（商談前進 / 関係深化 / 次アポ獲得 / 特になし）
- 「記録する」→ `records` テーブルに INSERT → `/dashboard` へ

---

## Phase 6 — ダッシュボード（Day 4 後半）

### `/dashboard` ページ

- 統計カード3枚（今月件数 / 平均評価 / 登録店舗数）— DB 集計
- 今後の接待予定リスト（records から upcoming 相当を表示）
- 最近の接待記録（records LIMIT 4 desc）
- よく使われる店 TOP5（records GROUP BY venue_id LIMIT 5）

---

## Phase 7 — お気に入り（Day 5 前半）

### `/favorites` ページ

- タブ切替（格式別 / シーン別）
- フィルタバー（エリア / ジャンル / 予算 / 並び順 select）
- カテゴリ別グリッド（`repeat(auto-fill, minmax(250px, 1fr))`）
- v1 はデータを seed の静的配列で返す（DB テーブルは拡大時）

---

## Phase 8 — ゲスト管理（Day 5）

### 4 画面

| パス | 内容 |
|---|---|
| `/guests` | 会社一覧（4社カード + 担当者数）|
| `/guests/[companyId]` | 会社詳細（会社メモ + 担当者リスト）|
| `/guests/[companyId]/[personId]` | 担当者カルテ（好み/NG + 接待履歴）|
| `/guests/new` | 新しいゲストを追加フォーム |

v1 では guests/companies テーブルを作らず、静的データで画面を作る。
記録連携（guest_id 紐付け）は拡大フェーズ。

---

## Phase 9 — 設定（Day 5 後半）

### `/settings` ページ

- リスト形式（会社ルール・メーカー辞書 / アカウント / 通知 / ヘルプ / ログアウト）
- 「会社ルール・メーカー辞書」→ brand_rules の CRUD 画面（v1 簡易版）

---

## Phase 10 — Vercel デプロイ（Day 6）

### 事前準備

- [ ] Neon DB プロジェクト作成 → `DATABASE_URL` 取得
- [ ] `SESSION_SECRET` 生成（`openssl rand -base64 32`）

### Vercel 設定

```
vercel.json（必要なら）
env vars:
  DATABASE_URL=...
  SESSION_SECRET=...
  NEXT_PUBLIC_APP_URL=https://settai-navi.vercel.app
```

### デプロイ手順

1. `cd web && npm run build` — ローカルでビルド確認
2. `npx tsx scripts/seed.ts` — Neon に seed 投入（環境変数セット後）
3. `vercel --prod` or GitHub 連携で自動デプロイ
4. スモークテスト: 探索 → 詳細 → 記録の golden path を確認

---

## ファイルレイアウト全体像

```
settai/
  data/
    schema.ts              ← TS 型定義（既存）
    venues.seed.json       ← 店データ seed（既存）
    brand-rules.seed.json  ← ビールルール seed（既存）
  design/
    handoff/               ← UI の正（既存）
    mockimage/             ← モック画像（既存）
    ui-spec.md             ← UI 仕様書（既存）
  docs/
    spec.md / design.md / plan.md（このファイル）
  web/                     ← ★ ここを新規作成
    src/
      app/
        layout.tsx
        search/page.tsx
        venues/[id]/page.tsx
        record/page.tsx
        dashboard/page.tsx
        favorites/page.tsx
        guests/.../
        settings/page.tsx
        api/...
      components/
        layout/
        ui/
        search/
        venues/
      lib/
        db/
          client.ts        ← Neon lazy proxy
          schema.ts        ← Drizzle スキーマ
        rule-engine.ts     ← 4軸スコアリング純関数
        types.ts
      scripts/
        seed.ts
    tailwind.config.ts
    .env.local.example
    package.json
```

---

## 依存 env（Sora 発行待ち）

| 変数 | 用途 | 発行元 |
|---|---|---|
| `DATABASE_URL` | Neon Postgres 接続 | Neon コンソール |
| `SESSION_SECRET` | セッション暗号化（使う場合）| `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Vercel URL | デプロイ後に確定 |

---

## 実装順サマリー

```
Day 1: Phase 1（scaffold + DB）+ Phase 2（layout + nav）
Day 2: Phase 3 前半（フィルタパネル + ルールエンジン）
Day 3: Phase 3 後半（結果リスト）+ Phase 4（店舗詳細）
Day 4: Phase 5（記録）+ Phase 6（ダッシュボード）
Day 5: Phase 7（お気に入り）+ Phase 8（ゲスト管理）+ Phase 9（設定）
Day 6: Phase 10（デプロイ・スモークテスト）
```
