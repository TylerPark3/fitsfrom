#!/usr/bin/env python3
"""Pick the cleanest product image per catalog item: no people, white background.

Downloads tiny thumbnails of each candidate, scores skin-tone fraction and
corner whiteness, rewrites `image` in catalog.gen.json, drops `_candidates`.
"""
import io
import json
import sys
import urllib.request

from PIL import Image

CAT = 'src/data/catalog.gen.json'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}


def fetch_thumb(src: str) -> Image.Image:
    url = f"{src}?width=64"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=8) as r:
        return Image.open(io.BytesIO(r.read())).convert('RGB')


def skin_fraction(im: Image.Image) -> float:
    px = list(im.getdata())
    n = len(px) or 1
    skin = sum(
        1
        for (r, g, b) in px
        if r > 95 and g > 40 and b > 20 and r > g and r > b and abs(r - g) > 15
    )
    return skin / n


def corner_brightness(im: Image.Image) -> float:
    w, h = im.size
    patches = []
    for (x0, y0) in [(0, 0), (w - 6, 0), (0, h - 6), (w - 6, h - 6)]:
        crop = im.crop((max(0, x0), max(0, y0), max(0, x0) + 6, max(0, y0) + 6))
        px = list(crop.getdata())
        patches.append(sum(sum(p) / 3 for p in px) / (len(px) or 1))
    return sum(patches) / len(patches)


def score(src: str):
    try:
        im = fetch_thumb(src)
    except Exception:
        return None
    return skin_fraction(im), corner_brightness(im)


def dhash(im: Image.Image) -> int:
    g = im.convert('L').resize((9, 8))
    px = list(g.getdata())
    bits = 0
    for row in range(8):
        for col in range(8):
            bits = (bits << 1) | (1 if px[row * 9 + col] > px[row * 9 + col + 1] else 0)
    return bits


def main():
    items = json.load(open(CAT))
    changed = 0
    seen_hashes = {}
    drop = set()
    for i, it in enumerate(items):
        cands = it.pop('_candidates', None) or []
        if not cands:
            continue
        best = None  # (rank_tuple, src)
        for src in cands:
            s = score(src)
            if s is None:
                continue
            skin, corner = s
            clean = skin < 0.06 and corner > 228
            rank = (0 if clean else 1, skin, -corner)
            if best is None or rank < best[0]:
                best = (rank, src)
            if clean:
                break  # first clean image wins — keeps merch order
        if best:
            new = f"{best[1]}?width=900"
            if new != it['image']:
                changed += 1
            it['image'] = new
            # Mark whether the winning shot is actually a flat product photo.
            # The mannequin can only wear flat shots — pasting a photo of a
            # model onto the figure puts a whole second person on the body.
            it['flat'] = bool(best[0][0] == 0)
        # perceptual dedupe: identical-looking photos = the same product listed twice
        try:
            h = dhash(fetch_thumb(it['image'].split('?')[0]))
            if h in seen_hashes:
                drop.add(it['id'])
            else:
                seen_hashes[h] = it['id']
        except Exception:
            pass
        if i % 40 == 0:
            print(f"{i}/{len(items)}…", file=sys.stderr)
    items = [it for it in items if it['id'] not in drop]
    json.dump(items, open(CAT, 'w'), indent=1)
    print(f"done — {changed} swapped, {len(drop)} visual dupes removed, {len(items)} products", file=sys.stderr)


if __name__ == '__main__':
    main()
