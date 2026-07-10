#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx>=0.27"]
# ///
"""
settai-navi — Google Places (New) から各店の代表写真を取得して
data/images/<slug>.jpg に保存し、venues seed の photoUrl を更新する。

使い方:
  export GOOGLE_PLACES_API_KEY="AIza..."          # Sora が発行したキー
  uv run scripts/fetch-places-photos.py            # 既定: data/venues.ginza.seed.json
  uv run scripts/fetch-places-photos.py --input data/venues.seed.json
  uv run scripts/fetch-places-photos.py --dry-run  # 検索のみ・DLしない

前提: GCP で「Places API (New)」有効化＋課金アカウント紐付け済み。
   ~25 店なら Text Search + Photo で数十円未満（月 $200 無料枠内）。

冪等: 既に data/images/<slug>.jpg があり photoUrl 設定済みの店はスキップ。
Venue 型は変更しない（photoUrl のみ更新）。Places 由来の place_id/lat/lng/電話/URL は
sidecar data/places-meta.json に別途保存し、後日のクロスチェック用に残す。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import httpx

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.photos,places.location,places.internationalPhoneNumber,"
    "places.websiteUri,places.rating,places.userRatingCount"
)
PROJECT_ROOT = Path(__file__).resolve().parents[1]  # 02_projects/settai-navi/


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def text_search(client: httpx.Client, api_key: str, query: str) -> dict | None:
    """1件だけ返す Text Search。ヒットしなければ None。"""
    resp = client.post(
        SEARCH_URL,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        },
        json={
            "textQuery": query,
            "languageCode": "ja",
            "regionCode": "JP",
            "maxResultCount": 1,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"    ! search HTTP {resp.status_code}: {resp.text[:200]}")
        return None
    places = resp.json().get("places") or []
    return places[0] if places else None


def download_photo(client: httpx.Client, api_key: str, photo_name: str, dest: Path) -> bool:
    """Place Photo media を JPG として保存。"""
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    resp = client.get(
        url,
        params={"maxWidthPx": 1200, "key": api_key},
        headers={"Accept": "image/*"},
        follow_redirects=True,
        timeout=60,
    )
    if resp.status_code != 200:
        print(f"    ! photo HTTP {resp.status_code}: {resp.text[:160]}")
        return False
    ctype = resp.headers.get("content-type", "")
    if "image" not in ctype:
        print(f"    ! photo unexpected content-type: {ctype}")
        return False
    dest.write_bytes(resp.content)
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="data/venues.ginza.seed.json",
                    help="venues seed JSON (repo-relative)")
    ap.add_argument("--images-dir", default="data/images")
    ap.add_argument("--meta", default="data/places-meta.json")
    ap.add_argument("--dry-run", action="store_true", help="検索のみ・DLしない")
    ap.add_argument("--sleep", type=float, default=0.3, help="店ごとの待機秒")
    args = ap.parse_args()

    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key and not args.dry_run:
        die("環境変数 GOOGLE_PLACES_API_KEY が未設定。`export GOOGLE_PLACES_API_KEY=...` してから実行。")

    input_path = (PROJECT_ROOT / args.input).resolve()
    images_dir = (PROJECT_ROOT / args.images_dir).resolve()
    meta_path = (PROJECT_ROOT / args.meta).resolve()
    if not input_path.exists():
        die(f"input が無い: {input_path}")
    images_dir.mkdir(parents=True, exist_ok=True)

    venues = json.loads(input_path.read_text(encoding="utf-8"))
    meta = {}
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))

    hits, saved, misses, skipped = 0, 0, [], 0
    with httpx.Client() as client:
        for v in venues:
            slug = v["slug"]
            name = v.get("name", "")
            dest = images_dir / f"{slug}.jpg"

            if v.get("photoUrl") and dest.exists():
                print(f"[skip] {slug} — 既に写真あり")
                skipped += 1
                continue

            query = f"{name} {v.get('address', '')}".strip()
            print(f"[search] {slug} :: {query}")
            place = text_search(client, api_key or "", query) if not args.dry_run else None

            if args.dry_run:
                time.sleep(args.sleep)
                continue

            if not place:
                print("    - ヒットなし")
                misses.append((slug, "no-place"))
                time.sleep(args.sleep)
                continue

            hits += 1
            # sidecar meta（Venue 型は変えず別ファイルに）
            meta[slug] = {
                "place_id": place.get("id"),
                "location": place.get("location"),
                "phone": place.get("internationalPhoneNumber"),
                "website": place.get("websiteUri"),
                "rating": place.get("rating"),
                "userRatingCount": place.get("userRatingCount"),
                "formattedAddress": place.get("formattedAddress"),
            }

            photos = place.get("photos") or []
            if not photos:
                print("    - place はあるが写真なし")
                misses.append((slug, "no-photo"))
                time.sleep(args.sleep)
                continue

            if download_photo(client, api_key or "", photos[0]["name"], dest):
                # photoUrl は data/ からの相対パス（= "images/<slug>.jpg"）
                v["photoUrl"] = f"images/{slug}.jpg"
                saved += 1
                print(f"    ✓ saved {dest.name}")
            else:
                misses.append((slug, "download-failed"))
            time.sleep(args.sleep)

    if not args.dry_run:
        input_path.write_text(
            json.dumps(venues, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        meta_path.write_text(
            json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    print("\n===== サマリー =====")
    print(f"店数: {len(venues)} / 検索ヒット: {hits} / 写真保存: {saved} / skip: {skipped}")
    if misses:
        print("取得できなかった店（photoUrl は null のまま / 手当て要）:")
        for slug, why in misses:
            print(f"  - {slug}: {why}")


if __name__ == "__main__":
    main()
