# Sora の手作業チェックリスト — 会食ナビ「50店を地図に出す＋写真取込」

貼り先はすべて **`/Users/sorasasaki/work-os/02_projects/settai-navi/web/.env`**（1ファイル）。
値は念のため **シングルクォートで囲む**（`KEY='値'`）。※`$` を含む値が展開される事故防止。

---

## 段階1：地図(A)を出す ← まずここだけで50ピン出ます

### ☐ Step 1. Neon のパスワードをローテ（🔴 漏洩対応・必須）
1. https://console.neon.tech を開いてログイン
2. 会食ナビの Neon プロジェクトを選択（DB名 `neondb` / ホスト `ep-silent-sea-aotovmx5...`）
3. 左メニュー **Roles**（または Dashboard の "Connection Details"）→ ロール **`neondb_owner`**
4. **Reset password**（パスワード再生成）を実行
5. 画面に出る **接続文字列（`postgresql://neondb_owner:...@ep-silent-sea-...neon.tech/neondb?sslmode=require...`）** をコピー
   - ⚠️ **Pooled connection**（`-pooler` が入ってる方）を選ぶ

### ☐ Step 2. `.env` に貼る
`/Users/sorasasaki/work-os/02_projects/settai-navi/web/.env` を開いて：
```
DATABASE_URL='ここに Step1 でコピーした接続文字列'
```
→ **できたら「1入れた」と伝えてください。** 僕が seed→座標backfill→地図起動して50ピンをスクショで見せます。

---

## 段階2：写真(B)を自動取込 ← 地図が出た後でOK

### ☐ Step 3. Google Places API キー
1. https://console.cloud.google.com を開く（会食ナビ用の GCP プロジェクト。無ければ新規作成）
2. 上部でプロジェクトを選択 → 「APIとサービス」→「ライブラリ」
3. **「Places API (New)」** を検索して **有効にする**
4. そのプロジェクトに **お支払い（Billing）アカウントが紐づいている**ことを確認（未設定なら紐付け）
5. 「APIとサービス」→「認証情報」→「認証情報を作成」→ **APIキー** → 表示されたキーをコピー

### ☐ Step 4. Cloudinary キー
1. https://cloudinary.com にログイン → Dashboard
2. **Product Environment Credentials** に出ている3つをコピー：
   - **Cloud name**
   - **API Key**
   - **API Secret**（"reveal" で表示）

### ☐ Step 5. `.env` に貼る
```
GOOGLE_PLACES_API_KEY='Step3 のキー'
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY='Step3 と同じキーでOK'
CLOUDINARY_CLOUD_NAME='Step4 の Cloud name'
CLOUDINARY_API_KEY='Step4 の API Key'
CLOUDINARY_API_SECRET='Step4 の API Secret'
```
→ **できたら「2入れた」と伝えてください。** 写真バックフィルを回して、Cloudinary への保存件数と「住所不一致（別店ヒット疑い）」リストを報告します。

---

## 早見表
| やりたいこと | 必要な Step | 誰がやる |
|---|---|---|
| 地図に50ピン | Step 1〜2（Neon だけ） | Sora→僕 |
| 各店の写真 | Step 3〜5（Places + Cloudinary） | Sora→僕 |

- Places/Cloudinary が未設定でも**地図は動きます**（写真がグレーになるだけ）。急ぐなら段階1だけでOK。
- どこかで詰まったら、その画面のスクショを送ってくれれば続きを誘導します。
