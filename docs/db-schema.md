# 接待ナビ — DB 型設計 v1（ロジック逆算）

> 作り方の順番: **データ構造から決めない**。まず「いい感じの店が出るロジック」を固定し、そのロジックが成り立つために**最小限必要なデータ構造を逆算**する。
> 入力: [`data-availability-matrix.md`](./research/settai-venue-selection-research.md の隣) の「データベースに入れるか」列（Sora 判断）を反映。
> 出力: markdown の型定義（このあと TS union / Drizzle schema に落とす）。

## Sora 判断の反映（前提の確定事項）

| 決定 | 内容 | 設計への影響 |
|---|---|---|
| **格式は「単価で判定」** | 手タグ S/A/B を廃止 | `formality_grade` を**保存しない**。予算から**導出**（+例外時だけ手動 override）|
| **個室系は"検索で入れる"** | 有無・質・座席形式・遮音を DB に残す | `has_private_room`/`private_room_type`/`seat_style`/`soundproof` を nullable で保持 |
| **soft 属性は DB に入れない** | 雰囲気・酒品揃え・老舗/受賞・予約困難度・季節感・タクシー動線 | venues に列を作らない。雰囲気/粋は**記録で補完** or 拡大 |
| **黒子力・予約堅牢性は記録で** | 会計の気配り・料理ペース・個室確保の確実性 | venues でなく **`settai_records`** の蓄積から集計 |

---

## 1.「いい感じの店が出る」ロジックの要件化

### 1.1 入力（RecommendQuery = 実行時。テーブルではない）

| 項目 | 型 | 由来 | 使う軸 |
|---|---|---|---|
| `company` | string? | フォーム | G タブー |
| `role` | 担当/課長/部長/役員 | フォーム | A 格式・予算 |
| `purpose` | 顔合わせ/御礼/クロージング/謝罪/慰労/祝い | フォーム | A・F・I |
| `area` | string | フォーム | フィルタ |
| `partySize` | int | フォーム | フィルタ・個室 |
| `needsPrivateRoom` | bool | フォーム | B |
| `budgetCap` | int? | フォーム/設定 | 予算 |
| `guestId` | uuid? | カルテ選択（拡大）| E・重複回避 |
| `guest.ngFoods` / `allergies` | string[] | カルテ/フォーム | E（食のNG）|
| `guest.preferences` / `sakePref` / `origin` / `health` | … | カルテ | E |
| `guest.isTired` / `isFirstMeeting`（導出）| bool | 記録から導出 | I「攻めすぎ」分岐 |

### 1.2 パイプライン（4段）

```
Step0 派生:  role×purpose → 要求格式バンド / 予算ターゲット / シーン要件（機密性・華やかさ）
Step1 フィルタ: 確定NG・必須条件で「NGラベル」付け（除外はせずランキング下部へ残す）
Step2 スコア:  9軸を加減点で合成（下表 1.3）
Step3 理由文:  各加減点に理由テキスト＋確信度（confirmed/estimated/unknown）
Step4 ランキング: スコア降順。NG は理由付きで下部に残す（学び／人間が最終判断）
```

### 1.3 軸別スコアリング表（＝「発火条件 × 店属性 → 効果」→ 必要データが決まる）

| 軸 | 発火条件（入力）| 参照する店データ | 効果 | 必要な列/テーブル |
|---|---|---|---|---|
| **A 格式** | role×purpose→要求バンド | `budget_min/max`（→格式導出）| バンド一致=加点／下回り=大減点／上回りすぎ=減点（恐縮）| venues.budget_*, (config)role_purpose |
| **予算** | budgetCap / ターゲット | `budget_min/max` | ターゲット内=加点／オーバー=NGラベル | venues.budget_* |
| **B 個室** | needsPrivateRoom / 機密性(purpose) | `has_private_room`,`private_room_type`,`seat_style` | 完全個室=加点／半個室=減点／(役員 & 座敷/正座)=減点／個室無し&要=NG | venues 個室4列 |
| **D 立地** | area / 相手拠点 | `walk_minutes`,`nearest_station`,`lat/lng` | 駅近=加点／遠い=減点 | venues 立地列 |
| **E 料理** | guest.ngFoods/allergies/pref/origin | `genre`（+拡大で食材）| 好み一致=加点／NG食材該当=減点/NG／出身地マッチ=加点 | venues.genre, guests |
| **E×F ジャンル適性** | purpose | `genre` | (寿司/懐石×顔合わせ=◎)／(焼肉×フォーマル=✕)| venues.genre, (config)genre_scene_fit |
| **G タブー** | company | `beer_affiliation`,`beer_confidence` | 競合系統&confirmed=確定NG／自社系統=加点／unknown=注意 | venues.beer_*, brand_rules |
| **H 予約堅牢性** | （重要接待）| `settai_records`集計 | 過去に個室確保OK実績=加点／取れなかった=減点 | settai_records |
| **C 黒子力** | 常時 | `settai_records`集計（rating/申し送り）| 高評価店=加点／「騒がしい」等の反省=減点 | settai_records |
| **I 粋・攻めすぎ** | guest.isTired / isFirstMeeting | （記録・手動）| 疲労/初回×過剰格式or予約困難=減点 | settai_records, config |
| **重複回避** | guestId | `settai_records`(guest×venue) | 前回と同じ店=減点 | settai_records |

> ここから逆算される結論: **確定判定に使えるのは venues の確定列（予算・立地・ジャンル・個室・ビール確信度）と brand_rules だけ**。加減点の「効く」部分（黒子力・堅牢性・粋・重複回避）は **settai_records の蓄積**が無いと成立しない → records を"あとで足す"ではなく**設計の中心**に置く。

---

## 2. ロジック → 必要データ 逆算サマリ

| ロジックが欲しいもの       | データ構造                                               | v1                  |
| ---------------- | --------------------------------------------------- | ------------------- |
| 予算内か・格式が釣り合うか    | `venues.budget_min/max` ＋ role_purpose の対応表（config） | ✅                   |
| 個室で密談できるか・正座NG回避 | `venues` 個室4列                                       | ✅（検索で best-effort）  |
| 相手を疲れさせない立地か     | `venues` 立地列                                        | ✅                   |
| 相手の好み/NGに合うか     | `venues.genre` ＋ `guests`（好み/NG）                    | genre=✅ / guests=拡大 |
| 競合ビールを避け自社を立てるか  | `venues.beer_*` ＋ `brand_rules`                     | ✅                   |
| 目的（シーン）に合う店か     | `venues.genre` ＋ genre_scene_fit（config）            | ✅（雰囲気は近似）           |
| 黒子力・予約の堅牢性・粋     | `settai_records` の集計                                | 蓄積次第（記録UIが要）        |
| 同じ相手に同じ店を出さない    | `settai_records`(guest×venue)                       | 拡大（guest 紐付け）       |
| 役職→格式/予算、シーン→店性格 | **config（コード or 設定テーブル）**                           | ✅                   |

---

## 3. DB 型（markdown）

型記法: `enum{…}` は文字列 union（Drizzle は pgEnum）。`?` は nullable。

### 3.1 `venues` — 店マスタ（v1 コア）

| カラム | 型 | NULL | 由来 | ロジックでの役割 |
|---|---|---|---|---|
| `id` | uuid PK | — | 生成 | — |
| `slug` | text UNIQUE | — | seed | 冪等化キー |
| `name` | text | — | Places/公式 | 表示 |
| `genre` | text | — | Places/公式 | E 料理・F シーン適性の土台 |
| `area` | text | — | Places/公式 | エリアフィルタ |
| `address` | text | — | Places/公式 | 表示 |
| `nearest_station` | text | ✓ | 地図 | D 動線 |
| `walk_minutes` | int | ✓ | 地図 | D 距離スコア |
| `lat` / `lng` | numeric | ✓ | Places（拡大）| D 距離計算 |
| `budget_min` | int（円/人・夜）| — | 公式コース価格 | 予算判定 ＋ **格式導出の主入力** |
| `budget_max` | int | — | 公式 | 同上（予算上限判定）|
| `has_private_room` | bool | ✓ | 検索（表記は不正確な点に注意）| B フィルタ（参考値）|
| `private_room_type` | enum{完全個室,半個室,座敷,なし,unknown} | ✓ | 検索/下見 | **B 個室の質**（密談可否）|
| `seat_style` | enum{椅子,掘りごたつ,座敷,混在,unknown} | ✓ | 検索/下見 | 役員×正座NG 減点 |
| `soundproof` | enum{可,不可,unknown} | ✓ | 検索/下見 | 機密性が要る回で加点/減点 |
| `beer_affiliation` | enum{kirin,asahi,suntory,sapporo,mixed,unknown} | — | LLM+Web enrichment | G 競合タブー（brand_rules と join）|
| `beer_confidence` | enum{confirmed,estimated,unknown} | — | enrichment | **confirmed のみ確定NG**、他は注意 |
| `beer_source_url` | text | ✓ | enrichment | 根拠 |
| `requires_reservation` | bool | — | 公式/予約サイト | 運用フラグ |
| `formality_override` | enum{S,A,B} | ✓ | 手動（例外時のみ）| 単価導出が外れる老舗/逆パターンの上書き（§5）|
| `photo_url` / `website_url` / `phone` | text | ✓ | Places/公式 | 表示・一次情報 |
| `tags` | text[] | ✓（default `{}`）| 手動 | v1 は基本空。将来の雰囲気/粋タグ用の**拡張口**のみ |
| `curation_note` | text | ✓ | 手動 | キュレーションの勘所メモ |
| `source` | text | — | — | データ出所 |
| `created_at` / `updated_at` | timestamptz | — | — | メタ |

**意図的に持たない**（Sora 判断 ❌）: 酒品揃え・雰囲気・老舗/受賞・予約困難度・季節感・タクシー/雨天動線 → 拡大 or 記録で補完。

### 3.2 `guests` — 相手カルテ（拡大フェーズ。型は今確定）

| カラム | 型 | NULL | ロジックでの役割 |
|---|---|---|---|
| `id` | uuid PK | — | — |
| `name` | text | — | 表示 |
| `company` | text | ✓ | G と紐付け |
| `role` | text | ✓ | A/予算（クエリ既定値）|
| `origin` | text | ✓ | E 出身地マッチ加点 |
| `preferences` | text[] | ✓ | E 好み加点（好物/ジャンル/酒）|
| `ng_foods` | text[] | ✓ | E 減点/NG（苦手）|
| `allergies` | text[] | ✓ | **食の重大NG**（確定NG候補）|
| `dietary` | enum{none,halal,vegetarian,kosher,…}? | ✓ | 宗教禁忌（確定NG）|
| `health_notes` | text | ✓ | 中度NG（痛風/糖尿）|
| `alcohol` | enum{下戸,ビール,日本酒,ワイン,焼酎,不問} | ✓ | E 酒適合 |
| `memo` | text | ✓ | 自由メモ |
| `created_at`/`updated_at` | timestamptz | — | — |

### 3.3 `brand_rules` — 会社ルール辞書（v1・確定済み）

| カラム | 型 | 例 | 役割 |
|---|---|---|---|
| `id` | uuid PK | — | — |
| `company` | text | キリン | 相手企業（クエリと突合）|
| `affiliation` | enum(=venues と同じ) | asahi | venues.beer_affiliation と join |
| `effect` | enum{ng,prefer} | ng | 競合=ng / 自社=prefer |
| `label` | text | アサヒ系 | 理由文表示 |

- seed: ビール4社 = 各社 own→prefer / 競合3社→ng（16行）。
- 拡大: `company` を companies マスタ化 ＋ affiliation を業界横断（要 社内ヒアリング）。

### 3.4 `settai_records` — 接待履歴（＝蓄積。黒子力/堅牢性/重複回避/好み学習の唯一の源）

> v1 の最小 `records`(id/venue_id/decided_at/rating?/note?) を、この型に**拡張**する。書き込みが発生した時点で Neon 昇格。

| カラム | 型 | NULL | ロジックでの役割 |
|---|---|---|---|
| `id` | uuid PK | — | — |
| `venue_id` | uuid FK→venues | — | 集計キー |
| `guest_id` | uuid FK→guests | ✓ | 重複回避・好み学習（拡大）|
| `company` | text | ✓ | guest 未整備時の代替キー |
| `role` | text | ✓ | シーン再現の材料 |
| `purpose` | enum(=query.purpose) | ✓ | 「この目的で使われた店」検索 |
| `party_size` | int | ✓ | 参考 |
| `decided_at` | timestamptz | — | 重複回避の時系列 |
| `rating` | int(1..5) | ✓ | **C 黒子力/総合の加点** |
| `went_well` | text | ✓ | 良かった点（加点根拠の理由文）|
| `reflection` | text | ✓ | **反省・申し送り → 該当店の減点**（例「騒がしい」）|
| `reservation_ok` | bool | ✓ | **H 予約堅牢性**の実績 |
| `business_outcome` | text | ✓ | フライホイール（受注等）|
| `share_scope` | enum{self,team} | — | 社内ナレッジ共有範囲 |
| `created_at` | timestamptz | — | — |

**派生（集計ビュー / materialized）**: `venue_stats(venue_id, avg_rating, times_used, last_reservation_ok, demerit_flags[])` を records から算出しスコアに合成（実テーブルにせず view でよい）。

### 3.5 ロジック規則（DB でなく config / コード）

「役職→格式」等はデータでなく**規則**。列にせずコード定数 or 設定テーブルで持つ。

| 名前 | 形 | 中身 |
|---|---|---|
| `role_purpose_matrix` | `(role,purpose) → {formalityBand:S/A/B, budgetMin, budgetMax, needsSoundproof, sceneProfile}` | 例: 役員×クロージング → {S, 12000, 15000, true, 静か} |
| `genre_scene_fit` | `(genre,purpose) → score/flag` | 寿司×顔合わせ=◎ / 焼肉×フォーマル=✕(慰労のみ) |
| `budget_bench` | `band → range` | B:〜8k / A:8–12k / S:12–15k |
| `food_ng_severity` | `type → weight` | allergy/宗教=確定NG / 健康=中減点 / 苦手=微減点 |

> これらは暗黙知ヒアリングで数値を確定（`status.md` 次アクション）。v1 は JSON/TS 定数で開始し、育ったら設定テーブル化。

---

## 4. 格式 = 単価判定 の扱い（reasoning 明示）

- **既定**: `formality = f(budget_max)` → `budget_bench` で S/A/B に写像。手タグ `formality_grade` は**廃止**（Sora 判断）。
- **理由**: 単価は公式サイトから ✅ 自動で取れ、seed の手作業を大幅に減らせる。「格式≒価格帯」は近似として実務的に十分機能する。
- **リスク（研究の指摘）**: 格式は本来 老舗度・受賞・ジャンルも効き、単価だけでは近似止まり（安い老舗の名店 / 高いだけのカジュアル店で外れる）。
- **拡張フック**: 例外時だけ `formality_override`(S/A/B, nullable) で上書き。既定は空 → 運用で「単価と体感がズレた店」だけ手当てする（YAGNI）。UX ゲートで外れが目立てば、代理指標（創業年/受賞）を列追加して導出式を精緻化。

---

## 5. v1 で作る / 拡大で足す

| テーブル | v1 | 拡大 |
|---|---|---|
| `venues` | ✅ コア（TS seed → Neon）| lat/lng, 雰囲気tags, enrichment 精緻化 |
| `brand_rules` | ✅ ビール16行 | companies マスタ / 業界横断ルール |
| `settai_records` | △ 最小で開始（記録UI入れた時点で本型へ）| guest 紐付け・集計ビュー |
| `guests` | ✗（クエリ入力で代替）| ✅ カルテ本実装 |
| config（規則）| ✅ TS 定数 | 設定テーブル化 |

**次アクション**: この型で OK なら → ① `data/schema.ts` を本設計に更新（formality_grade 廃止・個室4列・records 拡張）② `role_purpose_matrix` 等の config を暗黙知ヒアリングで数値埋め ③ Drizzle schema へ。
