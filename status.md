---
name: settai-navi
status: active
next_action: 【リポ一本化 2026-07-10】正 repo を `sky0508/settai`（work-os 配下 02_projects/settai-navi）に統合。web コードを settai/web に取込み・impl ネスト git 解消（okinawa は 05_archives/settai-okinawa-impl-backup に退避）。残: ①🔴Neon本番キーのローテ(okinawa履歴に漏洩・GitHub公開済) ②web/npm install→ローカル起動確認 ③本番Vercelデプロイ ④暗黙知9軸で rule-engine 重み確定 ⑤旧 okinawa GitHub repo の archive/削除判断
due:
last_touched: 2026-07-10
---

# 接待ナビ（settai-navi） — ステータス管理

最終更新: 2026-07-10

## 2026-07-10 okinawa 1050「最適店検索（移動時間）」を settai に移植＋E2E 検証完了

承認 plan: `~/.claude/plans/users-sorasasaki-work-os-02-projects-se-purring-toucan.md`

旧 repo `sk2410yu/okinawa-2026-be-v1` の branch **1050**「参加者から最適な場所を探す」機能を settai に移植。**自社（admin ユーザーの拠点）＋ゲスト企業の最寄り駅から、各店への平均移動時間で店をランク**。駅すぱあと API（`EKISPERT_API_KEY`）or 座標ヒューリスティック（haversine/25km/h）で算出し `station_routes` にキャッシュ。

**移植方法**: okinawa の履歴は merge せず（漏洩コミット非継承の維持）、**機能ぶんのファイルのみツリー移植**。1050 の `.env`/`.env.local`/`check-db.ts` は持ち込まず、migration は 0001 衝突を避けて **0002 を再生成**。スコープ = 機能に絞る（map/venues 等の無関係手直しは非採用）。

**変更**:
- 新規: `web/src/app/search/optimal/*`（最適店検索 UI＋`findOptimalVenues`）, `web/src/app/settings/office/*`（自社拠点設定）, `web/src/lib/travel/*`（ekispert/heuristic/score/cache/types＋tests）, `web/src/app/{error,global-error}.tsx`
- マージ: `schema.ts`（users に office 列、companies に住所/最寄駅/座標、`station_routes` 表）, `guests/[companyId]/{actions,page}.tsx`（企業拠点入力フォーム）, `settings/page.tsx`（自社拠点導線）, `search/SearchClient.tsx`（「参加者から最適な場所を探す」リンク）
- migration `web/drizzle/0002_breezy_the_stranger.sql`（Neon は既に 1050 適用済みで no-op＝履歴整合のみ）

**E2E 検証済み**: `/guests/asahi` の拠点フォームでアサヒに拠点登録 → `/search/optimal` で参加企業追加 → 「平均○分相当・自社○分（概算）・アサヒ○分（概算）」で店をランキング表示（駅すぱあとキー無し＝座標概算）。会食含む全ルート 200（非後退）。秘密混入なし・`.env` は追跡外。

**残**: `EKISPERT_API_KEY`（Sora 用意で「概算」→実移動時間に。無くても動く）。push は未（Sora 判断）。

---

## 2026-07-10 沖縄の実店舗 30 件を seed 投入（名護15 / 那覇15）

京橋・銀座と同じ方式で、接待・会食でも使える沖縄の店 30 件を DB 投入。

- **内訳**: 名護 15（会食寄り8 + 居酒屋7）／那覇 15（会食寄り8 + 居酒屋7）。formality S7 / A6 / B17。夜予算 2,000〜30,000 円。
- **選定**: sonnet リサーチ agent 4 本並列（エリア×性格で分担）。食べログ・ヒトサラ・ホットペッパー・公式サイト等で住所/電話/個室を裏取り。ミックス方針（個室ありの郷土料理・鉄板・寿司を軸に、三線ライブ系の人気沖縄居酒屋も混在）。
- **データ**: `data/venues.okinawa.seed.json`（30件）。`beerAffiliation` は enum に orion が無いため全 `unknown`。OHANA の夜予算のみソース無 → 推定 15,000〜25,000。
- **座標**: Nominatim で backfill 完了（**30件すべて lat/lng 済み・NULL 0**）。ビル名付き住所は `backfill-coords-clean.ts` で建物名除去→再ジオコーディング、名護「城」地区の2件のみ市中心座標を手当て。
- **配線**: `web/scripts/seed.ts` に okinawa seed 読込追加（京橋30+銀座20+沖縄30）。slug 冪等。commit `0c83c64` push 済み。
- **エリアフィルタ対応（同日追記）**: 那覇の15件は district 単位（久茂地/松山/牧志…）で入れていたが、rule-engine のエリア絞り込みは `v.area` 完全一致のため `'那覇'` フィルタに一致しなかった → **DB・seed JSON とも `area='那覇'` に正規化**（district は住所に残る）。`FilterPanel.tsx` の `AREAS` に `名護`・`那覇`（＋抜けていた `銀座`）を追加。
- **地図の全国クラスタ対応（同日追記）**: `/map` は全ピンの平均座標＋zoom13 固定で、東京+沖縄の2クラスタだと中心が海上になりピンが1つも見えないバグ → `MapClient.tsx` に `FitToPins`（fitBounds）を追加し、常に登録ピン全体が収まるよう自動ズーム。
- **残**: 写真（Stage 3 = Google Places + Cloudinary）は API キー必要のため未実行。地図・検索カードはこの時点で写真なしで表示可。

---

## 2026-07-10 「会食を作る」タブ = 日程調整（LettuceMeet 型）Phase 1 実装＋E2E 検証完了

承認 plan: `~/.claude/plans/users-sorasasaki-work-os-02-projects-se-purring-toucan.md`

**確定仕様（ブレスト済み）**: LettuceMeet 型（時間グリッドをドラッグ塗り、○△×表ではない）／全員ログイン不要（トークン方式：参加者 `/s/<publicToken>`＋主催者 `/host/<adminToken>`）／候補=日付×時間スロット／回答UI=レスポンシブ ハイブリッド（PC ドラッグ塗り／スマホ タップ）／フロー=日程先決め→後で店→2段階メール通知。左サイドバー＆BottomNav に **「会食を作る」タブ（`/schedules`）** 新設。

**モックアップ**: `design/schedule/mockups.html`（4画面・グリッド実操作可・Sora 承認済み）。

**実装（Phase 1 縦スライス = 作成→回答→確定）**:
- DB 4テーブル追加（`schedule_polls`/`schedule_slots`/`schedule_participants`/`schedule_responses`）＝migration `web/drizzle/0001_cultured_killmonger.sql`、Neon 適用済み。確定時に既存 `reservations` 行を生成→ダッシュボード「今後の接待予定」に自動表示。
- 主要ファイル: `web/src/app/schedules/*`, `web/src/app/s/[publicToken]/*`, `web/src/app/host/[adminToken]/page.tsx`, `web/src/components/schedule/{AvailabilityGrid,CopyButton}.tsx`, `web/src/components/layout/AppChrome.tsx`（公開/host は素シェル）, `web/src/lib/schedule/{time,tokens}.ts`。
- **TZ 規約**: スロットは JST 実インスタントで保存（`Date.UTC(...) - 9h`）・表示は +9h して UTC getter（`web/src/lib/schedule/time.ts`）。既存 `reservations.scheduledAt` の local 表示と日付一致を担保（当初 wall-clock UTC ラベル方式で +1 日ズレ→修正済み）。

**E2E 検証済み（localhost dev）**: 作成→参加者2名がドラッグ塗り回答（email で upsert）→host ヒートマップで重なり集計＋最有力枠→確定→ダッシュボードに **7/15(水) 調整中** 正表示。

**残（plan の後続 Phase・未 commit）**:
- Phase2: 確定後の店紐付け（`host/[adminToken]/venue`・既存 `searchVenues` 再利用・`attachVenue` で reservation を confirmed+venue 更新）
- Phase3: カレンダー（.ics util + Route Handler + Google Maps/Calendar リンク・画面上表示）
- Phase4: Resend メール2段（🔴要 Sora の API キー＋検証済み送信ドメイン。キー無しは no-op で画面ボタンにフォールバック）
- 未決 UX: 確定操作（推奨枠ワンボタン採用済／セルクリック確定は未）／BottomNav 7タブ目の収まり

---

> **正 repo = `github.com/sky0508/settai`（= work-os 配下 `02_projects/settai-navi/`）に一本化（2026-07-10、前回決定を逆転）**。
> 設計docs・実コード(`web/`)・データ・スクリプトを全てこのリポに集約。今後の開発は全てここで行う。
> 旧 `sk2410yu/okinawa-2026-be-v1` の実装は `web/` として取込み済み（git履歴は引き継がず新規スタート＝漏洩コミットを持ち込まないため）。
> 旧 impl clone は `05_archives/settai-okinawa-impl-backup/`（okinawa .git・未push commit da033b6・未コミット変更ごと退避）にバックアップ。
> ⚠️ **Neon 本番クレデンシャルが okinawa git履歴（GitHub push済 commit c02e2a8）に残存 → ローテ必須**（SORA-SETUP.md 段階1 Step1）。

### 統合後の構成
```
02_projects/settai-navi/   ← git: sky0508/settai（唯一の正リポ）
├── web/          Next.js 16 アプリ本体（旧 impl/web、source のみ・node_modules は npm install で再生成）
├── data/         seed JSON（venues 系は impl の enriched 版を採用）＋ review-gallery.html
├── docs/         spec / design / plan / db-schema / research 等
├── design/       UI モック・handoff・schedule
├── scripts/      Python（gallery生成・Places写真取得）
├── status.md / README.md / SORA-SETUP.md
```
> ※ venues.seed.json は impl版(28店・座標/カナ/写真enriched)を採用。旧 settai版のみにあった2店（京橋たけ本・八重洲大飯店）はバックアップに温存＝要る場合は再投入。実DBは Neon 側に別途seed済みのため seed.json 差分は低リスク。

## 現在のフェーズ

**実装フェーズ — v1 コア実装済み（impl repo に先行）**

要件精緻化（Phase 0.5）で止まっていた docs を実態が追い越していた。impl repo `sk2410yu/okinawa-2026-be-v1` の `web/` に **Next.js 16 + Neon + Leaflet + Cloudinary** で v1 コアが動作（探索・地図・記録・ゲスト/店 CRUD・ダッシュボード・お気に入り・設定）。残るは本物データ投入・env キー・デプロイ・暗黙知チューニング、そして**セキュリティ対応（クレデンシャル漏洩）**。

接待の店選び支援ツール。相手企業ごとの制約（例: キリン→競合ビール専売の店はNG）と、新人のセンス不足による失礼を、NG理由付きのおすすめランキングで防ぐ。接待記録を評価・シチュエーション付きで蓄積し社内ナレッジ基盤へ育てる。

## ドキュメント

- [x] `docs/spec.md` — 要件定義（何を・なぜ）
- [x] `docs/design.md` — 設計仕様（構成・データモデル・判定ロジック・UI）
- [x] `docs/plan.md` — 実装計画（**impl repo 側に存在**）
- [ ] `README.md` / `SETUP.md` — 運用手順・env セットアップ（web README は create-next-app 雛形のまま・要整備）
- [x] `docs/research/settai-venue-selection-research.md` — 接待の店選び解像度上げリサーチ（2026-07-08, 9軸A〜Iへマッピング済み・ヒアリング設問への反映提案付き）

## 決定事項（ヒアリング済み）

- 位置づけ: プロダクト化前提だが v1 は thin slice
- NG軸: 競合製品 / 格式 / 予算 / 相手の嗜好・NG食材
- 店データ源: Google Places API 中心
- 会社ルール: ビール4社内蔵 + ユーザー追加可
- enrichment: ハイブリッド（競合ルール発火時のみ）＋確信度表示＋DBキャッシュ
- 入出力: 探索型。NG はランキング下部に理由付きで残す
- v1 地理: 東京駅・京橋周辺
- 差別化: 接待記録＋評価＋シチュエーションによる社内ナレッジ共有

## 次のアクション

> 2026-07-09 実装棚卸しで全面差し替え。旧「plan.md 作成→実装着手」は impl repo で既に完了済み。

1. **⚠️【最優先・セキュリティ】Neon 本番クレデンシャルのローテ** — impl repo `web/check-db.ts` に接続文字列（`neondb_owner:npg_...@ep-silent-sea-...neon.tech`）がハードコード＆コミット済み。Neon ダッシュボードでパスワードローテ → `check-db.ts` を `.env` 読込に変更 or gitignore。（Sora 作業＝Neon ダッシュボード）
2. **正 repo への一本化** — 設計docs（spec/design/status/暗黙知9軸）を impl repo `okinawa-2026-be-v1` へ集約。以後この work-os 側はポインタのみ。
3. **本物の店データ投入** — 現状 DB はデモ中心（店14件）。docs 側 `data/venues.seed.json`（京橋30件）/`venues.ginza.seed.json`（銀座20件）を impl repo の DB スキーマ（`formalityGrade` 直持ち等）へ型変換して seed 投入。
4. **env キー投入（Sora 停止点）** — `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`（店画像アップロード）、`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`（店登録 autofill）。未設定でもデモは動くが両機能はオフ（graceful degrade）。
5. **Vercel デプロイ** — `vercel.json` はあり。Vercel に接続し `DATABASE_URL` 他 env を投入。
6. **暗黙知9軸ヒアリング → rule-engine 重み確定** — `lib/rule-engine.ts` のスコア係数（+30/-45 等）は現状ハードコードの仮値。下記9軸ヒアリングで重みを確定し反映。
7. **db-schema.md と実コードのリコンサイル** — `db-schema.md`（格式=予算導出・`formality_grade` 廃止）と実コード（`formalityGrade` 列を直持ち）が未整合。どちらを正にするか判断。

## 暗黙知9軸（ヒアリングの叩き台 / 2026-07-08 整理）

現行 spec が拾えているのは B（個室=有無のみ）と G（競合ビール）だけ。高価値な軸ほど Places に構造化データが無く、人手タグ・相手プロフィール・社内記録でしか埋まらない。

| 軸              | 勘所（暗黙知）                                        | 新人がやらかす例                  | 信号の在り処                                | なかやま      |
| -------------- | ---------------------------------------------- | ------------------------- | ------------------------------------- | --------- |
| A. 格式の釣り合い     | 「相手役職 × 会の目的」で店格の最低ラインが決まる。下回れば失礼、上回りすぎも恐縮させる  | 部長にチェーン個室 / 役員に食べログ3.5    | 客単価・老舗度・受賞・ジャンル。機械は近似止まり→**人手グレードタグ** |           |
| B. 個室の"質"      | 有無でなく質。完全個室（密談可）/椅子・掘りごたつ（役員は正座NG）/防音/眺め       | 半個室で声が丸聞こえ / 座敷で相手が正座に苦しむ | Places 不正確→**人手タグ**                   | 個室ありor なし |
| C. 接待オペ適性      | 良い店は黒子。会計を席で見せない/仲居が空気を読む/「いつもの」が効く            | 相手の前で伝票 / 料理ペースが乱れる       | データ化不可→**接待実績タグ＋社内記録が唯一の源**           |           |
| D. 立地・動線       | 相手を疲れさせない・迷わせない。拠点から近い/タクシー/二次会動線              | 遠い店 / 二次会の当てがない           | 座標・駅距離は Places で取れる                   |           |
| E. 料理・酒 × 相手適合 | 相手が主役。好物・出身地で刺す/苦手・アレルギー・宗教・健康を外す/酒の品揃えを好みに    | 苦手を出す / 下戸に日本酒自慢店         | ジャンル=Places、酒=公式、好み/NG=相手プロフィール       |           |
| F. シーン適合       | 目的で最適解が変わる。顔合わせ=静か無難/御礼=華やか/謝罪=格式と静けさ/慰労=リラックス | 祝いが地味 / 謝罪でカジュアル          | 入力（目的）×店属性                            |           |
| G. 相手企業・業界タブー  | 相手の陣営を尊重。競合製品/政治宗教/係争相手                        | キリンにアサヒ専売                 | brand_rules ＋ enrichment（確実な時のみ）      |           |
| H. 予約の堅牢性      | 確実に個室が押さえられる/直前・人数変更・ドタキャン耐性                   | 個室が取れず / 人数変更を断られる        | 運用情報・記録                               |           |
| I. 粋・加点        | 予約困難店が取れた事自体/隠れ家/大将との関係/名店のストーリー。外すと寒い         | 疲れてる相手に攻めすぎ               | 人手タグ・記録                               |           |

**メタ発見（ヒアリングで検証したい）**:
- 高価値な A・B・F を判定するには、入力フォームに「相手の役職」「会の目的」「相手の拠点」が必須（現行フォームは材料不足）。
- 暗黙知の本丸（A/B/C）は Places に無い → 手キュレーション＋手タグ前提が補強される。
- "使うほど賢くなる"が本当に効くのは C（接待オペ適性）。一度使わないと分からない＝社内記録が効く一点突破の根拠。

## セッションログ

### 2026-07-10 (続) 店舗写真を各3枚のギャラリー表示に
- Sora「いい感じ・各店3枚くらい入れて」→ `venues` に **`photos`(jsonb string[]) 列を追加**（ALTER TABLE 直接適用＋schema.ts 更新。`photoUrl`=代表1枚目を維持し map/検索カード/ダッシュボードは無改修）。
- `backfill-venue-photos.ts` を**最大3枚取得・配列保存**に改修（target=`jsonb_array_length(photos)<3`、public_id=`<slug>-0/1/2`）→ 再実行で **全57店が3枚ずつ**（avg 3.00）。
- 店舗詳細に**写真ギャラリー**（ヒーロー＋サムネ3枚）を追加（`venues/[id]/page.tsx`）。実機確認済み（銀座小十）。
- **commit + push 済み**: impl `main` `e8a811e`（`25a0a99..e8a811e`）。tsc clean。

### 2026-07-10 実行: A(地図)完成 / B(写真)は Google 側ブロッカーで保留
- Sora が env セットアップ完了（.env に Neon/Places/Cloudinary）。**DATABASE_URL はパスワードのみ貼られていた**ので既知ホスト（`ep-silent-sea-...-pooler`）と合成してフル接続文字列を復元→接続OK（ローテ有効）。
- **seed 実行**: 49件 insert（`nihonbashi-yukari` はデモ既存でskip）→ 50スラッグ全て DB に存在。
- **座標**: `backfill-venue-coords.ts`(Nominatim) は日本のビル名住所に弱く 49件中9件のみ成功（フォールバック正規表現がビル名終わりに不発）→ **`backfill-venue-photos.ts`(Places) が「店名+住所」検索で残りを補完 → lat/lng は 59/59 完了**。
- **✅ A(地図)完成**: `/map` を実機確認、**59ピン**が京橋/銀座/日本橋にクラスタ表示（記録ゼロ=グレー・記録あり=緑「1」）。map 改修＋座標投入が効いた。スクショ取得済み。
- **⚠️ B(写真)ブロッカー**: Places のレスポンスに **`photos` と `reviews` だけが来ない**（`*` field mask でも欠落・他60フィールドは取得可・**東京タワーでも0枚**・HTTP 200/エラー無し）。＝店固有でなく**キー/プロジェクト/請求先レベルで licensed content(写真・口コミ)が絞られている**。写真保存 0件。
  - **Sora 確認事項（写真を出すため）**: ①GCP で **「Places API」(レガシー) も有効化**（New だけだと photos が落ちる事例あり）②請求先アカウントが有効な課金状態か（トライアルでない）③APIキーの API 制限で除外していないか（一時的に「制限なし」でテスト）。
  - 代替案: 公式サイト(websiteUrl)の OG 画像取得に切替も可。
- **住所不一致検出**: フラグはデモ店(六本木/新宿/赤坂)のみ＝全角半角差の誤検知。**対象50店(銀座/京橋/日本橋/八重洲)は不一致ゼロ＝正しい店にヒット**。
- dev サーバー稼働中（localhost:3000）。**未 commit / push**。

#### 追記: B(写真)解決 — 請求先リンクで解放 → 57/59 完了
- 原因確定＝**トライアル状態の課金だと 200 でデータは返るが `photos`/`reviews` だけ落ちる**。Sora が有料請求先 `sora_billing` を作成し**プロジェクトに紐付け**→ 銀座小十で写真10枚返るのを確認。
- `backfill-venue-photos.ts` 再実行 → **写真 57/59 を Cloudinary(`res.cloudinary.com/p9ee5aic/settai/<slug>.jpg`) に保存**。取得不可は2件のみ(`kyobashi-takemoto`/`yaesu-daihanten`＝Googleに写真なし)。
- DB 最終: venues 59 / lat 59 / photo_url 57。
- **✅ 実機確認**: `/venues/<id>`(銀座小十) で Cloudinary 実写真が表示。`/map` で59ピン。**A+B 完了**。
- **写真取得不可の2件（京橋たけ本 `kyobashi-takemoto`・八重洲大飯店 `yaesu-daihanten`）を DB＋seed から削除** → DB 最終 = venues 57 / 座標 57 / 写真 57（全店に座標＋写真）。
- **commit + push 完了**: impl `main` に `25a0a99`（`c02e2a8..25a0a99`）。push 前に `.env` 追跡外・旧クレデンシャル文字列除去・`SORA-SETUP.md` は gitignore を確認済み。
- 残（別件）: ①本番 Vercel デプロイ ②暗黙知9軸で rule-engine 重み確定 ③db-schema.md リコンサイル ④店舗詳細中段の空白ボックス（既存UI・要調査）。

### 2026-07-09 (夕) AB=「50店を Google で肉付けして地図に出す」実装（DB非依存分を完了・env 停止点で停止）
- **ブレスト結論**: ゴールは A(地図ピン表示)＋B(既存50店のデータ自動取込)。新規発掘(C/D)はやらない。地図タイルは Leaflet+OSM でキー不要、**Google Places の役割は「データ」だけ**。「Google でどこまで取れるか」を Artifact でフィールド全カタログ化（座標/基本情報/写真/評価=✅、個室/正確な予算/ビール系列=✕）。承認 plan=`~/.claude/plans/users-sorasasaki-work-os-02-projects-se-eventual-hammock.md`。
- **impl repo を clone → 実地インスペクション**（public repo・`/Users/sorasasaki/work-os/02_projects/settai-navi/impl`）。判明した重要事実:
  - `scripts/backfill-venue-coords.ts` は **Google でなく Nominatim(OSM) で住所→座標**。**地図(A)は Google キー不要**で座標が入る。Google が要るのは写真(B)だけ。
  - `map/page.tsx` は **「接待記録が1件以上ある店だけピン表示」** → 50店は記録ゼロなので座標入れても出ない → **map 改修は必須**（条件付きでなく確定）。
  - `venues` テーブルは旧 seed 型とほぼ一致（`formalityGrade`/`privateRoomType` 1列/`lat`/`lng`/`photoUrl` 列あり）。`seed.ts` は京橋30件しか読まない。
  - `check-db.ts` の Neon 本番接続文字列漏洩を実物確認（唯一のハードコード箇所）。
- **実施したコード変更**（impl・型チェック clean・未 commit）:
  - `check-db.ts` 漏洩削除→`dotenv` 読込 / `seed.ts` に銀座20件追加(計50) / `data/venues.ginza.seed.json` 複製 / `map/page.tsx`+`MapClient.tsx` を記録ゼロ店も座標あればピン表示(ニュートラル色) / `scripts/backfill-venue-photos.ts` 新規(Places→Cloudinary) / `PlaceAutocomplete.tsx` の React19 型エラー修正(既存バグ)
  - `web/.env` 雛形 + `web/DATA_IMPORT.md` 手順書を用意。
- **停止点（Sora）**: ①Neon パスワードローテ→新 `DATABASE_URL` ②(写真用)Places/Cloudinary キー。値が入れば seed→coords backfill→dev で50ピン、続けて photos backfill。
- **⚠️ 未 commit / push なし**。impl の変更は `/Users/sorasasaki/work-os/02_projects/settai-navi/impl` に置いてあるだけ（Sora 確認後に commit/push 判断）。

### 2026-07-09 実装状況の棚卸し — 実装が別 repo で大きく先行していたことが判明
- **発見**: docs（この work-os / `sky0508/settai`）は「Phase 0.5 要件精緻化・実装未着手」で止まっていたが、**実装は別 repo `sk2410yu/okinawa-2026-be-v1` の `web/` で v1 コアが完成**していた（最終コミット 2026-07-09 16:29・1コミットに squash）。
  - スタック: **Next.js 16 + Neon(Drizzle) + Leaflet + Cloudinary**。**11テーブル**（users/companies/guests/venues/brand_rules/records/favorites/reservations/tags/venue_tags/guest_tags）。当初 thin slice（venues+brand_rules）想定を超え、フライホイール（ゲスト/記録/お気に入り）まで実装済み。
  - 画面: home / search / **map** / dashboard / guests(CRUD) / venues(CRUD) / record / favorites / settings / reservations。
- **Sora の「残り4項目」認識 vs 実態**（← 大半すでに実装済み）:

  | Sora の認識 | 実態 | 判定 |
  |---|---|---|
  | 地図の機能 | `map/` に Leaflet + OpenStreetMap。**APIキー不要**。記録のある店を件数・平均★色分けピン表示（`MapClient.tsx`/`map/page.tsx`） | ✅ ほぼ完成 |
  | 検索のロジック | `lib/rule-engine.ts` に **9軸スコアリング**（格式/予算/ビール/個室/立地/シーン/履歴/NG食材）+ NG降順 + 4軸バー。作り込み済み | ✅ 完成（重みは仮値） |
  | DBにデータを入れる | Neon プロビジョン済み + seed一式（seed/seed-guests/seed-real-records/seed-favorites/backfill-coords）+ デモ14件投入済み | ⚠️ 仕組み完成・本物データ薄 |
  | 画像も入れる | `venues/actions.ts` に Cloudinary アップロード、`PlaceAutocomplete.tsx` に Google Places autofill。`photoUrl` 列あり | ⚠️ 配線済・envキー未設定でオフ |

- **⚠️ セキュリティ**: impl repo `web/check-db.ts` に **Neon 本番接続文字列がハードコード＆コミット済み**（`neondb_owner:npg_AHBaiIeq30xS@ep-silent-sea-aotovmx5-...neon.tech/neondb`）→ **パスワードローテ必須**（次アクション1）。
- **決定**: **正 repo = impl（`okinawa-2026-be-v1`）に一本化**。設計docs も将来そちらへ集約。work-os 側はポインタ降格。
- **未整合として記録**: 実コードは `formalityGrade`（S/A/B）列を直持ち／`docs/db-schema.md` は「格式=予算導出・`formality_grade` 廃止」→ 逆方向。リコンサイル要（次アクション7）。
- スコープ: 今回は status.md（＋memory）更新のみ。残作業は「次のアクション」に記録し着手せず。

### 2026-07-08 (夕) MVP スコープ & 店DBの型 確定 + 京橋 seed 収集開始
- **ブレスト成果**（承認済み plan: `~/.claude/plans/serene-swimming-cupcake.md`）:
  - **スコープ = 探索だけ**（`venues` + `brand_rules`）。guests/フライホイールは拡大フェーズ。地域 = 京橋・東京駅周辺。収集 = ハイブリッド（自動母集団→上位~25店を手タグ）。
  - **ストレージ = 型付き TS seed（DB無し）で開始**。records を足す時に Neon 昇格（型は不変）→ Sora の env 停止点を先送りできる。
- **venues の型を9軸マッピング根拠つきで確定** → `docs/design.md §4.A` を更新。列: 基本情報(name/genre/area/address/駅/徒歩/budgetMin-Max/photo/web/phone) + 暗黙知タグ(formalityGrade S/A/B・privateRoomType 完全/半/座敷/なし・beerAffiliation・beerConfidence・beerSourceUrl・tags[]・requiresReservation) + メタ。tenant_id/lat/lng/place_id は拡大時に追加。
- **型を in-repo 実体化**: `data/schema.ts`（Venue/BrandRule/DiningRecord の TS 型）+ `data/brand-rules.seed.json`（ビール4社ルール16行・確定）。
- **京橋の店 母集団収集を research agent(sonnet) に発注**（~30店。基本情報は公式サイト裏取り、beerAffiliation は確認できた店以外 unknown で安全側）。→ 完了後 `data/venues.seed.json` に。
- 未決（Sora 戻り確認）: スコープA で確定か / 地域 京橋 で確定か / tags を text[] で持つ方針 OK か。

### 2026-07-08 UI モック生成 + 方向確定
- 判定ロジックの深掘り（センス2層／フライホイール）は**後日ヒアリングしてから**に判断。先に UI を固める方針へ。
- 探索の中核体験を4 UX パラダイムで /image 生成 → 比較（`design/mockimage/pattern-A〜D`）。**pattern-C（相手カルテ起点）が刺さる**。
- **UI 方向 確定**:
  - **ホーム＝「お店を探す」起点**（初回は探す、2回目以降は来客を選べば履歴が効く）。来客選択→カルテ要約を条件に反映＝**A（探す）を器に C（カルテ）を流し込むハイブリッド**。
  - **左ナビ4項目**: お店を探す / ゲスト / お気に入り / 設定。
  - **フライホイール要件を UI で具体化**: 接待記録に ★＋良かった点＋反省・申し送り＋業務成果。反省は該当店の減点に反映（例「騒がしい」→次回減点）。店舗詳細に4軸スコア（格式/予算/シーン/特別感）＋競合ドリンク確認（確信度付き）。
- **9画面のモック生成済み**（desktop 3 + mobile 5 + home）→ `design/mockimage/`（`desktop-*` / `mobile-*`）。
- **UI 仕様書 `design/ui-spec.md` 作成**（Claude Design 手渡し用。画像＋この仕様書で UI 実装依頼）。
- 次: Sora が画像＋ui-spec.md を Claude Design に渡す。未モック（設定=会社/競合ルール編集・お気に入り・ゲスト一覧トップ）と来客必須/任意（→任意で確定）は ui-spec 末尾に明記。

### 2026-07-08〜09 UI完成系ハンドオフ取込み + 要件を UI と整合（B案）
- **検索フロー UI を /image で反復生成 → v3 で確定**（`design/mockimage/` v1=search-patterns / v2 / v3）:
  - v2 base で「お店を探す」ベース確定: 003フィルターパネル＋009リッチ店カードの合体。**格式=自動判定ピル**（バー廃止）／**競合ビール除外=手動ポップアップ**（4社チェック＋「選択を除外/選択以外を除外」の2モード）／サブタブ「条件から探す・ゲストから探す」。
  - **左ナビ 4→5タブに変更**: お店を探す / ゲスト管理 / お気に入り / 設定 / ダッシュボード。
  - v3 最終4枚（`design/mockimage/v3/`）: base_search / base_beer-popup / dashboard(商談前進率KPI削除・よく使われる店TOP5追加) / favorites(格式=役員クラスのみ＋シーン別＋格式/シーン切替・チーム共有=社内ナレッジ)。
- **Claude Design ハンドオフを取込み** → `design/handoff/`（`project/Settai Navi.dc.html` 一式＋uploads）。**これが UI 完成系（north-star）の正**。settai-navi は独立 git repo（origin: `github.com/sky0508/settai.git`）で commit/push はこのディレクトリ内。
- **UI ⇄ 要件のギャップ分析 → B案で確定**（UI=ビジョン／v1=薄く）。spec/design をブラッシュアップ（commit `317be55`）:
  - spec §0 新設（フェーズ方針・完成系5タブ・v1=探索フロー）。各機能に **【v1】/【拡大】タグ**。
  - **格式=自動判定に更新**（旧「手タグ S/A/B で確定」を **db-schema.md 準拠の予算・役職から導出**へ。手タグは override のみ）← 前回セッションの決定を上書き。
  - **競合ビール=自動NG(相手企業)主＋手動popup補助の二層**。**店舗詳細を v1 に格上げ**（1画面主義→探索フロー）。records に業務成果(商談前進/関係深化/次アポ/特になし)。
  - ゲスト管理・お気に入り・ダッシュボード・接待予定・学習は【拡大】（UI に存在するが v1 では作らない）。
- 次: plan.md（v1探索フロー実装計画）→ 暗黙知9軸ヒアリング。

### 2026-07-09 京橋 venues seed 実体化（data/）＋ DB型を db-schema.md へ深掘り
- **店DBの型と京橋 seed を in-repo で実体化**（`data/`）:
  - `data/schema.ts` — Venue/BrandRule/DiningRecord の TS 型
  - `data/venues.seed.json` — **京橋・八重洲・日本橋の接待店 30件**（research agent(sonnet) が公式サイト裏取り。検証済み・エラーなし。格式S5/A18/B7・予算7,800〜36,300円・個室あり27/30・ジャンル12種）
  - `data/brand-rules.seed.json` — ビール4社ルール16行 / `data/README.md`
- **⚠️ enrichment 再現性シグナル**: ビール系統 `confirmed=1 / unknown=29`。公式サイトから提供銘柄を確実に取れる店はほぼ皆無 → spec §8-2「確実率≥40%」は**現手法では未達**。ビール自動化の一次情報源を再設計する材料（安全側設計で unknown→注意なので実害なし）。
- **DB型を `db-schema.md`（ロジック逆算）に深掘り**（Sora 作成。`data/schema.ts` の初版を上書きする正典）:
  - 格式=**単価導出**（`formality_grade` 廃止 → `budget_bench` で S/A/B 写像 ＋ `formality_override` nullable 例外のみ）
  - 個室4列化（`has_private_room`/`private_room_type`{＋unknown}/`seat_style`/`soundproof`）
  - soft属性（雰囲気・酒品揃え・老舗/受賞・予約困難度）は **DB非搭載**（`tags` は v1 空・拡張口のみ／記録で補完）
  - `settai_records` 拡張（rating/went_well/reflection/reservation_ok/business_outcome/share_scope）＝黒子力・堅牢性・重複回避の唯一の源
  - 規則（role_purpose_matrix / genre_scene_fit / budget_bench / food_ng_severity）は DB でなく **config(TS定数)**。数値は暗黙知ヒアリングで確定
- **要リコンサイル（次セッション最優先の1つ）**: `data/schema.ts` と `venues.seed.json` は旧型（formalityGrade 必須・tags 充填・個室1列）のまま → **db-schema.md §5① に合わせて更新が必要**（formalityGrade→override 化・個室4列・tags 空寄せ・records 拡張）。30件の手タグ格式の扱い（override へ残すか破棄か）は要判断。

## メモ

- UI モックは合意済み（探索フォーム → 理由付き店カード）※ 入力に相手役職/会の目的/相手拠点を追加する改訂あり（9軸 A/B/D/F 判定のため）
- 実装プランの全体像は `~/.claude/plans/ng-compressed-pretzel.md` にも保存
- 忖度なしレビューは `docs/feedback-20260708.md`（看板を「競合ビールNG」→「格式×基礎の担保」に寄せる提案）。今回の暗黙知言語化はこの方針と整合。
- **2026-07-08 spec/design を C1〜C4 解消で改訂**（ブレスト結論 = `~/.claude/plans/4-melodic-dusk.md`）:
  - 位置づけ=「売るプロダクト候補」を明記 → moat は暗黙知自動化＋社内ナレッジ、格式/予算/個室/NG食材は table-stakes。
  - 検証 v1 を **外部APIゼロ・手キュレーション・確定的ルール**の thin slice に圧縮（Places/自動enrichment/guests・パーソナライズは「拡大フェーズ」へ）。design は【検証v1】【拡大】の2層構成に。
  - 格式は**手タグ S/A/B で確定**（Places 近似はしない）。データモデルは venues+brand_rules(+最小records) に圧縮。
  - 成功基準を **3ゲート（UX／再現性spike 確実率≥40%／需要）** に差し替え。実装前タスク=暗黙知ヒアリング→enrichment spike→顧客ヒアリング→seed。
  - design §9 に既存プロジェクト（saimu/yakin-checkin）からの**流用元マップ**を追加。
- Sora 依存の停止ポイント: Google Places API キー / Neon DATABASE_URL / SESSION_SECRET / Vercel デプロイ
