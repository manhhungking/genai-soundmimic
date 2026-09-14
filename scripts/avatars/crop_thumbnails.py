#!/usr/bin/env python3
"""One-time crop of public/assets/student-avatars.png (the 5x2 portrait lineup) into
10 individual square thumbnails at public/assets/avatars/thumbnails/{id}.png.

Grid mapping (locked, see docs/avatars/AVATAR_SPEC.md section 1):
    Row 1 (top):    leo, liam, noah, kai, hung
    Row 2 (bottom): hana, zoe, aisha, emma, maya

Usage:
    python3 scripts/avatars/crop_thumbnails.py
"""
import os
from PIL import Image

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCE = os.path.join(REPO_ROOT, "public", "assets", "student-avatars.png")
OUT_DIR = os.path.join(REPO_ROOT, "public", "assets", "avatars", "thumbnails")

GRID = [
    ["leo", "liam", "noah", "kai", "hung"],
    ["hana", "zoe", "aisha", "emma", "maya"],
]

ROWS = len(GRID)
COLS = len(GRID[0])


def grid_bounds(total, count):
    """Evenly divide `total` pixels into `count` cells using rounding, so any leftover
    (non-divisible) pixels land at cell edges via cumulative rounding instead of being
    dropped or shifting later cells out of alignment."""
    return [round(i * total / count) for i in range(count + 1)]


def main():
    img = Image.open(SOURCE)
    w, h = img.size
    print(f"Source: {SOURCE} ({w}x{h})")

    col_bounds = grid_bounds(w, COLS)
    row_bounds = grid_bounds(h, ROWS)
    print("Column bounds (px):", col_bounds)
    print("Row bounds (px):", row_bounds)

    os.makedirs(OUT_DIR, exist_ok=True)
    written = []
    for r in range(ROWS):
        for c in range(COLS):
            avatar_id = GRID[r][c]
            box = (col_bounds[c], row_bounds[r], col_bounds[c + 1], row_bounds[r + 1])
            cell = img.crop(box)
            # Cells are near-square already (~397x396); pad to an exact square canvas
            # with the source's own edge-adjacent background colour sampled from the
            # cell corner, rather than resizing/stretching (no distortion, no upscale).
            cw, ch = cell.size
            side = max(cw, ch)
            if cw != ch:
                canvas = Image.new(cell.mode, (side, side), cell.getpixel((0, 0)))
                canvas.paste(cell, ((side - cw) // 2, (side - ch) // 2))
                cell = canvas
            out_path = os.path.join(OUT_DIR, f"{avatar_id}.png")
            cell.save(out_path)
            written.append((avatar_id, box, cell.size, out_path))
            print(f"  {avatar_id}: box={box} size={cell.size} -> {out_path}")

    print(f"Done. Inspect the {len(written)} files under {OUT_DIR} directly (e.g. with an image "
          f"viewer or the Read tool) — no contact sheet is written to the repo.")


if __name__ == "__main__":
    main()
