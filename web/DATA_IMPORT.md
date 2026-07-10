# 店データ投入・地図表示 手順（50店を Google/Nominatim で肉付け）

work-os 側でブレストした「AB: 50店を地図に出す＋写真を自動取込」の実行手順。
コード変更は済み。あとは env を入れて下の順で流すだけ。

## 前提: `.env` を埋める
`web/.env`（gitignore 済み）の空欄を埋める。段階的に必要:
- **地図(A)に必要**: `DATABASE_URL`（★Neon ローテ後の新資格情報）
- **写真(B)に必要**: `GOOGLE_PLACES_API_KEY` / `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` / `CLOUDINARY_*`

## Stage 1 — 🔴 セキュリティ（最優先）
`check-db.ts` に埋まっていた Neon 本番接続文字列は削除済み（env 読込に変更）。
ただし **git 履歴には残る** ため、Neon ダッシュボードでパスワードをローテして旧資格情報を無効化すること。
新しい `DATABASE_URL` を `.env` に入れる。

## Stage 2 — 50店を投入（地図A）
```bash
cd web
npx tsx scripts/seed.ts                    # 京橋30 + 銀座20 = 50店を upsert（slug 冪等）
npx tsx scripts/backfill-venue-coords.ts   # 住所→座標（Nominatim/OSM・APIキー不要）
npx tsx check-db.ts                         # 件数確認（Venues が 50前後になる）
npm run dev                                 # http://localhost:3000/map で50ピンを確認
```
→ この時点で **A（地図）は完成**。Google キーは不要。

## Stage 3 — 写真を自動取込（B）
`.env` に Places / Cloudinary キーを入れてから:
```bash
cd web
npx tsx scripts/backfill-venue-photos.ts   # Places検索→写真DL→Cloudinaryアップ→photoUrl更新
```
- 冪等（`photoUrl` がある店はスキップ）
- 座標が空の店は Places の location でも補完（Nominatim を上書きしない）
- 実行後、**住所不一致（別店ヒットの可能性）** の一覧が出るので目視で手当て

## 変更したファイル
- `check-db.ts` — 漏洩クレデンシャル削除、`.env` 読込に
- `scripts/seed.ts` — 銀座20件を追加読み込み（計50件）
- `../data/venues.ginza.seed.json` — 銀座20件（work-os から複製）
- `src/app/map/page.tsx` / `MapClient.tsx` — 記録ゼロ店も座標があればピン表示（ニュートラル色）
- `scripts/backfill-venue-photos.ts` — 新規（Places→Cloudinary 写真バックフィル）
- `src/components/ui/PlaceAutocomplete.tsx` — React19 型エラーの修正（既存バグ）

## スコープ外（今回やらない）
新規店の大量発掘 / db-schema.md リコンサイル / rule-engine 重み調整 / 個室・予算・ビール系列の enrichment
