# 引き継ぎ: 接待ナビ（settai-navi）開発計画策定

## 1. メタ情報

- 作成日時: 2026-07-08
- 作業ディレクトリ: `C:\Users\MT626\cla_app\cla_hack_2`
- リポジトリ: `C:\Users\MT626\cla_app\cla_hack_2\settai`
- 引き継ぎ元セッションの主題: settai-navi のリポジトリ調査 → 開発計画・工数表・DB設計・アーキテクチャ・認証・デプロイフローの策定
- 会話言語: 日本語
- ユーザー指定の制約・前提: 「なにも実行しなくていい」（計画策定のみ。実装は次セッション以降）
- このMDの版: v1

---

## 2. エグゼクティブサマリー

- **主題**: 接待の店選び支援ツール「接待ナビ（settai-navi）」の開発計画を、既存リポジトリとデザインハンドオフを読んだうえで策定した
- **ユーザーの最初の要求**: デプロイしたいので開発予定を立ててほしい。デザインは `design/handoff/` を見てほしいとの指示
- **途中で明らかになった重要情報**:
  - リポジトリには spec/design/status/data seed/UI handoff がすべて揃っており、実装前フェーズの設計は完了済み
  - デザインハンドオフ（`design/handoff/project/Settai Navi.dc.html`）は 10 画面すべてを含む完全な HTML プロトタイプ（904行）
  - Neon DB は `docs/design.md` §1.A・§9 に明記されており確定技術スタック
  - v1 thin slice は「探索 → 店舗詳細 → 軽量記録」の3画面が必須。他はナビに含むが拡大フェーズ扱い
- **現在の状態**: 計画書（`docs/plan.md`）とインタラクティブなビジュアル計画書（Artifact）を作成済み。実装は未着手
- **確定**: 技術スタック、DB スキーマ設計、フェーズ分割、工数見積もり（54h/7日）
- **未確定**: Neon DATABASE_URL（Sora 側で発行待ち）、Vercel アカウント連携、SESSION_SECRET

---

## 3. ユーザーの意図と要件

### 3.1 主目的
settai-navi を Vercel にデプロイするための開発計画を立て、次セッションで実装を開始できる状態にする

### 3.2 明示された要件
- 工数管理表（フェーズ×時間）
- チェックリスト
- DB の UML（ER 図）
- アーキテクチャ図
- 認証の詳細
- デプロイまでの流れの詳細

### 3.3 好み・スタイル・制約
- このセッションでは「なにも実行しない」（ファイル書き込みと計画策定のみ）
- デザインは `design/handoff/` を正として扱う
- リポジトリは `git clone` して確認（Bash 経由）

### 3.4 やらないこと / 避けたいこと
- 実装（コード生成・実行）はしない
- 勝手なツール実行をしない（WebFetch は一度途中でユーザーに止められた）

---

## 4. 会話の時系列

### Step 1: リポジトリのクローン
- ユーザーの要求: GitHub リポジトリ（`https://github.com/sky0508/settai`）をクローンしていい
- 対応: `git clone` で `C:\Users\MT626\cla_app\cla_hack_2\settai` にクローン
- 確定した情報: リポジトリ構成（data/design/docs の3ディレクトリ）
- 参照したファイル: クローン後のファイル一覧（PowerShell `Get-ChildItem -Recurse`）
- 結果: 75ファイルのクローン完了

### Step 2: リポジトリ全体の読解
- 対応: README.md / status.md / docs/spec.md / docs/design.md / design/ui-spec.md を読み込み
- 確定した情報: プロジェクト全体の要件・設計・現在フェーズ・技術スタックを把握
- 参照したファイル:
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\README.md`
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\status.md`
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\spec.md`
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\design.md`
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\design\ui-spec.md`

### Step 3: デザインハンドオフの読解
- ユーザーの要求: 「デザインは handoff を見て」
- 対応: `design/handoff/README.md` と `design/handoff/project/Settai Navi.dc.html` を全文読み込み
- 確定した情報: 10 画面の構成、デザイントークン（ネイビー×ゴールド×クリーム）、レスポンシブ閾値（900px）、ナビ5タブ
- 参照したファイル:
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\design\handoff\README.md`
  - `C:\Users\MT626\cla_app\cla_hack_2\settai\design\handoff\project\Settai Navi.dc.html`（904行・全文読了）

### Step 4: テキスト版開発計画書の作成
- 対応: `docs/plan.md` を新規作成（Phase 1〜10、Drizzle スキーマ抜粋、ファイルレイアウト含む）
- 作成ファイル: `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\plan.md`

### Step 5: インタラクティブ計画書（Artifact）の作成
- ユーザーの要求: 工数表・チェックリスト・DB UML・アーキテクチャ・認証・デプロイフローを詳しく
- 対応: 5タブ構成の HTML Artifact を作成・公開
- Artifact URL: `https://claude.ai/code/artifact/04f9f422-e5c0-4dc3-ace9-6be5f1964474`

### Step 6: Neon DB の出典確認
- ユーザーの質問: 「Neon DB はどこかにあった？」
- 回答: `docs/design.md` §1.A と §9 に明記。`status.md` の「Sora 依存の停止ポイント」にも記載

---

## 5. 確定した事実（出所別）

### 5.1 ユーザーが述べた事実
- デプロイしたい
- 開発予定を立ててほしい
- デザインは handoff を見てほしい
- このセッションでは実行しなくていい
- 次のセッションでこの計画書を読ませながらやりたい

### 5.2 参照ソースから確認した事実

**技術スタック（出所: `docs/design.md` §1.A・§共通スタック）**:
- フレームワーク: Next.js 16（App Router）+ Tailwind
- DB: Neon（Serverless HTTP + lazy Proxy）+ Drizzle ORM
- 認証: v1 は無し or ベタ1本（iron-session）
- 配置: `web/` ディレクトリ（独立 git repo として）
- デプロイ: Vercel

**v1 スコープ（出所: `docs/spec.md` §0・§6）**:
- 探索フロー（条件入力 → 理由付きランキング）
- 店舗詳細（スコア内訳・確信度・おすすめ理由）
- 軽量記録（評価★・良かった点・反省・業務成果）
- 外部 API ゼロ・手キュレーション seed・確定的ルール

**データ（出所: `data/` ディレクトリ）**:
- `data/venues.seed.json`: 京橋・八重洲・日本橋の店舗 30 件
- `data/brand-rules.seed.json`: ビール4社の競合ルール 16 行
- `data/schema.ts`: Venue / BrandRule / DiningRecord の TypeScript 型定義

**デザイントークン（出所: `design/handoff/project/Settai Navi.dc.html`）**:
- プライマリ（ネイビー）: `#14233f` / `#1f2d47` / `#1b2c49`
- アクセント（ゴールド）: `#c2a15a` / `#b8944a`
- 背景（クリーム）: `#f6f3ec`
- レスポンシブ分岐: `window.innerWidth < 900` で mobile/desktop 切替
- フォント: Noto Serif JP（見出し）/ Noto Sans JP（本文）/ Material Symbols Outlined（アイコン）

**Sora 依存の停止ポイント（出所: `status.md`）**:
- Neon DATABASE_URL
- SESSION_SECRET
- Vercel デプロイ（アカウント連携）
- Google Places API キー（v1 では不要・拡大フェーズ）

**流用元（出所: `docs/design.md` §9）**:
- Neon lazy proxy: `yakin-checkin/web` の `src/lib/db/client.ts`
- 単一ユーザー認証: `saimu/web` の `password.ts` + `session.ts` + `login/actions.ts` + `proxy.ts`
- seed スクリプト: `yakin-checkin/web` の `scripts/seed.ts`
- ルールエンジン: `saimu/web` の `src/lib/repayment.ts` パターン

**注意: layout に認証ガードを置くと redirect loop になる**（出所: `docs/design.md` §9 共通教訓）

### 5.3 セッション内で推定した事項
- 工数見積もり（54h / 7日）はこのセッションで Claude が推定したもの。ユーザーから確認は取っていない

### 5.4 未確定・要検証の事項
- Neon DATABASE_URL（未発行）
- SESSION_SECRET（未生成）
- `web/` ディレクトリが既存プロジェクト（yakin-checkin / saimu）のどちらのリポジトリにあるか未確認（`docs/design.md` には「`02_projects/settai-navi/web/`」と記載あり）
- 工数の妥当性（ユーザー未確認）

---

## 6. 参照したファイルとソース

| 名前 | 絶対パス / URL | 用途 | 主な得た情報 |
|---|---|---|---|
| README.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\README.md` | プロジェクト概要把握 | 9軸・ドキュメント地図 |
| status.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\status.md` | 現在フェーズ・次アクション | 停止ポイント・セッションログ |
| docs/spec.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\spec.md` | 要件定義 | v1 スコープ・成功基準 |
| docs/design.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\design.md` | 設計仕様 | 技術スタック・DB設計・流用元マップ |
| design/ui-spec.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\design\ui-spec.md` | UI 仕様 | デザイントークン・画面一覧 |
| design/handoff/README.md | `C:\Users\MT626\cla_app\cla_hack_2\settai\design\handoff\README.md` | handoff 説明 | コーディングエージェント向け指示 |
| Settai Navi.dc.html | `C:\Users\MT626\cla_app\cla_hack_2\settai\design\handoff\project\Settai Navi.dc.html` | UI の正・全画面 | 10画面構成・デザイントークン・JS ロジック |
| data/schema.ts | `C:\Users\MT626\cla_app\cla_hack_2\settai\data\schema.ts` | 型定義 | Venue / BrandRule / DiningRecord 型 |
| data/venues.seed.json | `C:\Users\MT626\cla_app\cla_hack_2\settai\data\venues.seed.json` | seed データ | 店舗 30 件 |
| data/brand-rules.seed.json | `C:\Users\MT626\cla_app\cla_hack_2\settai\data\brand-rules.seed.json` | seed データ | ビール4社ルール 16 行 |

---

## 7. 作成・編集した成果物

### 成果物 1: docs/plan.md（テキスト版開発計画書）
- 絶対パス: `C:\Users\MT626\cla_app\cla_hack_2\settai\docs\plan.md`
- 新規作成
- 目的: `status.md` で「未作成」とマークされていた実装計画を作成
- 内容: Phase 1〜10 の詳細タスク、Drizzle スキーマ定義、ファイルレイアウト全体像、env 依存一覧、実装順サマリー

### 成果物 2: インタラクティブ計画書（Artifact）
- Artifact URL: `https://claude.ai/code/artifact/04f9f422-e5c0-4dc3-ace9-6be5f1964474`
- スクラッチパッド元ファイル: `C:\Users\MT626\AppData\Local\Temp\claude\C--Users-MT626-cla-app-cla-hack-2\1bdc66ea-2409-4366-955f-0bbbe0b7ef52\scratchpad\settai-plan.html`（セッション限定・次回使用不可）
- 新規作成
- 目的: 工数表・Gantt・チェックリスト・ER図・アーキテクチャ・認証・デプロイフローを1ページで閲覧
- 内容: 5タブ（工数&チェック / DB設計 / アーキテクチャ / 認証 / デプロイ）のインタラクティブ HTML。チェックリストはクリックで消せる

---

## 8. 現在地（最新状態）

- **完了していること**:
  - リポジトリ全体の読解（spec / design / status / handoff / data seed）
  - `docs/plan.md` の作成
  - インタラクティブ計画書（Artifact）の作成
  - Neon DB の採用根拠の確認（`docs/design.md` §1.A に明記）

- **分かっていること**:
  - `web/` ディレクトリはまだ存在しない（次セッションで `create-next-app` から始める）
  - デザインハンドオフに 10 画面すべての完全な HTML が揃っている
  - 流用元コードが `yakin-checkin/web` と `saimu/web` にある（ただしこのセッションでは読んでいない）

- **まだ分かっていないこと**:
  - `yakin-checkin/web` と `saimu/web` の実際のパス（`docs/design.md` には `02_projects/` 配下と記載あり）
  - Neon / Vercel のアカウント状況

- **保留中の論点**:
  - 工数見積もり（54h/7日）の妥当性はユーザーに確認していない
  - v1 で認証を入れるか省略するかは未決定（spec には「無し or ベタ1本」とある）
  - 拡大フェーズ画面（ダッシュボード等）を v1 の実装範囲に含めるかどうか

---

## 9. 次の一手 / 再開ポイント

- **次にやること（優先順）**:
  1. **Neon プロジェクト作成** → `DATABASE_URL` を取得（Sora 側作業）
  2. **`web/` ディレクトリの作成**: `create-next-app` で Next.js 16 App Router + Tailwind + TypeScript をセットアップ
  3. **Drizzle + Neon 接続**: `src/lib/db/client.ts`（lazy proxy）と `src/lib/db/schema.ts` を作成
  4. **seed スクリプト実行**: `data/*.seed.json` を Neon に投入
  5. **グローバルレイアウト**: サイドバー（デスクトップ）+ ボトムタブ（モバイル）
  6. **探索画面**（v1 コア）: フィルタパネル → ルールエンジン → 結果リスト

- **再開プロンプト例**:
  ```
  C:\Users\MT626\cla_app\cla_hack_2\settai\docs\2026-07-08-settai-navi-planning-handoff.md
  を読んで、§9 の再開ポイントから実装を始めてください。
  作業ディレクトリは C:\Users\MT626\cla_app\cla_hack_2\settai です。
  まず Neon の DATABASE_URL を教えてください。
  ```

- **着手前に確認すべき前提**:
  - Neon DATABASE_URL（必須。これがないと DB 接続・seed 投入ができない）
  - `yakin-checkin/web` と `saimu/web` のパス（流用元コードの場所）

- **想定される注意点・落とし穴**:
  - `layout.tsx` に認証ガードを置くと redirect loop になる → middleware（`src/middleware.ts`）に置く
  - Neon lazy proxy を使わないと build 時に `DATABASE_URL` 未設定で落ちる
  - handoff HTML の `<sc-if>` / `<sc-for>` タグは Claude Design 独自記法 → React コンポーネントに変換が必要
  - Material Symbols Outlined は Google Fonts CDN からの `<link>` で読み込む（next/font 非対応）
  - レスポンシブ分岐は `window.innerWidth < 900`（handoff と同じ閾値を維持する）

---

## 10. 制約・前提・判断記録

### 10.1 制約と前提
- このセッションでは実行・実装は行わなかった（ユーザー指定）
- WebFetch は途中でユーザーに一度止められた（GitHub の別ページへのアクセス）。その後クローンに切り替え
- 工数見積もり（54h/7日）は Claude による推定。根拠: handoff 10 画面の規模感と Next.js 開発の一般的な工数感

### 10.2 主要な判断と根拠

**判断: Neon を DB として採用**
- 採用理由: `docs/design.md` §1.A に「DB: Neon（Serverless HTTP + lazy Proxy）+ Drizzle ORM」と明記されていた
- 確信度: High（ドキュメントに明記）

**判断: v1 の必須画面を探索・詳細・記録の3画面とした**
- 採用理由: `docs/spec.md` §0 に「実装対象 v1（thin slice）= 探索フローに限定」と明記
- 確信度: High

**判断: 認証は「無し or iron-session のどちらでもよい」と記載**
- 検討した選択肢: 認証なし / iron-session 単一パスワード / 本格 NextAuth
- 採用理由: spec §6 に「認証: 無し or ベタ1本（本格認証は不要）」と記載。最終決定はユーザー次第
- 確信度: Medium（ユーザーの最終確認待ち）

---

## 11. 注意・限界

- `yakin-checkin/web` と `saimu/web` の実際のファイルは読んでいない（パスが不明なため）。次セッションで流用する前にファイルを確認すること
- 工数見積もり（54h/7日）はユーザーに確認していない推定値
- Artifact（ビジュアル計画書）のスクラッチパッドファイルはセッション固有のパスにあり、次セッションでは参照不可。Artifact URL（`https://claude.ai/code/artifact/04f9f422-e5c0-4dc3-ace9-6be5f1964474`）からアクセスすること
- `docs/plan.md` は Git 管理対象のリポジトリにあるが、このセッションではコミットしていない
