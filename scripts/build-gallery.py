#!/usr/bin/env python3
"""
settai-navi — venues seed JSON からレビュー用の自己完結 HTML ギャラリーを生成する。
Sora がブラウザで開いて 20 店を一目レビューし、○×・差替えを判断するための成果物。

使い方:
  python3 scripts/build-gallery.py                       # 既定: data/venues.ginza.seed.json
  python3 scripts/build-gallery.py --input data/venues.seed.json --out data/gallery-all.html

画像は data/ からの相対 (photoUrl="images/<slug>.jpg") を参照。写真未取得の店は placeholder。
出力 HTML は data/ 直下に置くので img src=photoUrl がそのまま解決する（file:// で開いてOK）。
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

GRADE_COLOR = {"S": "#8a6d1f", "A": "#1F2A44", "B": "#5b7a8c"}


def esc(x) -> str:
    return html.escape(str(x)) if x is not None else ""


def card(v: dict) -> str:
    slug = v.get("slug", "")
    name = esc(v.get("name"))
    genre = esc(v.get("genre"))
    area = esc(v.get("area"))
    station = esc(v.get("nearestStation"))
    walk = v.get("walkMinutes")
    bmin = v.get("budgetMin")
    bmax = v.get("budgetMax")
    grade = v.get("formalityGrade") or "?"
    room = esc(v.get("privateRoomType"))
    room_note = esc(v.get("privateRoomNote"))
    tags = v.get("tags") or []
    note = esc(v.get("curationNote"))
    url = v.get("websiteUrl") or ""
    phone = esc(v.get("phone"))
    flag = v.get("_flag")
    photo = v.get("photoUrl")

    budget = ""
    if bmin and bmax:
        budget = f"¥{int(bmin):,}〜¥{int(bmax):,}" if bmin != bmax else f"¥{int(bmin):,}"
    elif bmin:
        budget = f"¥{int(bmin):,}〜"

    if photo:
        img = f'<img src="{esc(photo)}" alt="{name}" loading="lazy">'
    else:
        img = '<div class="ph">写真未取得<br><span>(Places API で取得予定)</span></div>'

    tag_html = "".join(f'<span class="tag">{esc(t)}</span>' for t in tags)
    gc = GRADE_COLOR.get(grade, "#888")
    flag_html = f'<div class="flag">⚠ {esc(flag)}</div>' if flag else ""
    walk_txt = f"{station}駅 徒歩{walk}分" if station and walk is not None else esc(station)
    site = f'<a href="{esc(url)}" target="_blank" rel="noopener">公式サイト ↗</a>' if url else ""

    return f"""
    <article class="card">
      <div class="photo">{img}<span class="grade" style="background:{gc}">{esc(grade)}</span></div>
      <div class="body">
        <div class="head">
          <h2>{name}</h2>
          <span class="meta">{genre} ・ {area}</span>
        </div>
        <div class="row"><span class="k">予算(夜)</span><span class="v budget">{budget or '—'}</span></div>
        <div class="row"><span class="k">個室</span><span class="v">{room or '—'}{(' — ' + room_note) if room_note else ''}</span></div>
        <div class="row"><span class="k">立地</span><span class="v">{walk_txt or '—'}</span></div>
        <div class="row"><span class="k">電話</span><span class="v">{phone or '—'}</span></div>
        <p class="note">{note}</p>
        <div class="tags">{tag_html}</div>
        {flag_html}
        <div class="foot"><code>{esc(slug)}</code>{site}</div>
      </div>
    </article>"""


def build(venues: list[dict], title: str) -> str:
    cards = "\n".join(card(v) for v in venues)
    n = len(venues)
    # 集計
    grades = {}
    areas = {}
    for v in venues:
        grades[v.get("formalityGrade", "?")] = grades.get(v.get("formalityGrade", "?"), 0) + 1
        areas[v.get("area", "?")] = areas.get(v.get("area", "?"), 0) + 1
    with_photo = sum(1 for v in venues if v.get("photoUrl"))
    summary = (
        f"全{n}店 ・ 写真あり{with_photo} ・ "
        + "格式[" + " / ".join(f"{k}:{grades[k]}" for k in sorted(grades)) + "] ・ "
        + "エリア[" + " / ".join(f"{k}:{areas[k]}" for k in areas) + "]"
    )
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<style>
  :root {{ --navy:#1F2A44; --gold:#C2A15A; --ink:#222; --sub:#667; --line:#e7e7ea; --bg:#f6f6f4; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:-apple-system,"Hiragino Kaku Gothic ProN",sans-serif; color:var(--ink); background:var(--bg); }}
  header {{ position:sticky; top:0; background:var(--navy); color:#fff; padding:18px 24px; z-index:5; box-shadow:0 2px 8px rgba(0,0,0,.15); }}
  header h1 {{ margin:0; font-size:19px; letter-spacing:.02em; }}
  header .sum {{ margin-top:6px; font-size:12.5px; color:#cdd3e0; }}
  main {{ max-width:1160px; margin:0 auto; padding:22px 18px 60px; display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:18px; }}
  .card {{ background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 1px 3px rgba(0,0,0,.05); }}
  .photo {{ position:relative; aspect-ratio:16/10; background:#ececea; }}
  .photo img {{ width:100%; height:100%; object-fit:cover; display:block; }}
  .photo .ph {{ width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#9a9a9a; font-size:13px; text-align:center; }}
  .photo .ph span {{ font-size:11px; }}
  .grade {{ position:absolute; top:10px; left:10px; color:#fff; font-weight:700; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 1px 4px rgba(0,0,0,.3); }}
  .body {{ padding:14px 15px 12px; display:flex; flex-direction:column; gap:7px; flex:1; }}
  .head h2 {{ margin:0; font-size:16px; line-height:1.35; }}
  .head .meta {{ font-size:12.5px; color:var(--sub); }}
  .row {{ display:flex; gap:8px; font-size:13px; line-height:1.5; }}
  .row .k {{ flex:0 0 58px; color:var(--sub); }}
  .row .v {{ flex:1; }}
  .budget {{ font-weight:700; color:var(--navy); }}
  .note {{ margin:4px 0 2px; font-size:12.5px; color:#444; line-height:1.6; }}
  .tags {{ display:flex; flex-wrap:wrap; gap:5px; }}
  .tag {{ font-size:11px; background:#f0ede4; color:#6b5d33; padding:2px 8px; border-radius:20px; }}
  .flag {{ font-size:12px; color:#9a3412; background:#fef2ec; border:1px solid #f6d8c8; padding:5px 8px; border-radius:8px; }}
  .foot {{ margin-top:auto; padding-top:8px; border-top:1px dashed var(--line); display:flex; justify-content:space-between; align-items:center; font-size:12px; }}
  .foot code {{ color:#999; font-size:11px; }}
  .foot a {{ color:var(--gold); text-decoration:none; font-weight:600; }}
</style></head>
<body>
<header><h1>会食ナビ — 銀座＋京橋補完 レビュー用ギャラリー</h1><div class="sum">{esc(summary)}</div></header>
<main>
{cards}
</main>
</body></html>
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="data/venues.ginza.seed.json")
    ap.add_argument("--out", default="data/review-gallery.html")
    ap.add_argument("--title", default="会食ナビ — 銀座＋京橋 レビュー")
    args = ap.parse_args()

    input_path = (PROJECT_ROOT / args.input).resolve()
    out_path = (PROJECT_ROOT / args.out).resolve()
    venues = json.loads(input_path.read_text(encoding="utf-8"))
    out_path.write_text(build(venues, args.title), encoding="utf-8")
    print(f"✓ {len(venues)} 店 → {out_path}")


if __name__ == "__main__":
    main()
