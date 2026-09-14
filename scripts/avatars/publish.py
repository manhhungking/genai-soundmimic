#!/usr/bin/env python3
"""Copy verified staged avatar GLBs into the runtime asset location.

Only run this AFTER scripts/avatars/verify_glb.mjs reports success — this script itself
re-checks scripts/avatars/_verify_result.json (written by verify_glb.mjs) and refuses to
publish any avatar that isn't recorded there as loaded_ok with all three required clips,
so a stale or partial verify run can't accidentally get published.

Usage:
    python3 scripts/avatars/publish.py [id ...]   (defaults to all 10)
"""
import json
import os
import shutil
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STAGING_DIR = os.path.join(REPO_ROOT, ".build-staging", "avatars")
PUBLIC_DIR = os.path.join(REPO_ROOT, "public", "assets", "avatars")
VERIFY_RESULT = os.path.join(os.path.dirname(__file__), "_verify_result.json")

ALL_IDS = ["leo", "liam", "noah", "kai", "hung", "hana", "zoe", "aisha", "emma", "maya"]


def main():
    ids = sys.argv[1:] or ALL_IDS

    if not os.path.exists(VERIFY_RESULT):
        print(f"ERROR: {VERIFY_RESULT} not found. Run scripts/avatars/verify_glb.mjs first.")
        sys.exit(1)

    with open(VERIFY_RESULT) as f:
        verify_data = {r["id"]: r for r in json.load(f)}

    published, blocked = [], []
    for avatar_id in ids:
        record = verify_data.get(avatar_id)
        staged_path = os.path.join(STAGING_DIR, f"{avatar_id}.glb")
        if not record or record.get("status") != "loaded_ok" or not record.get("hasAllRequiredClips"):
            blocked.append((avatar_id, "not verified as loaded_ok with all required clips"))
            continue
        if not os.path.exists(staged_path):
            blocked.append((avatar_id, f"staged file missing at {staged_path}"))
            continue
        os.makedirs(PUBLIC_DIR, exist_ok=True)
        dest = os.path.join(PUBLIC_DIR, f"{avatar_id}.glb")
        shutil.copy2(staged_path, dest)
        published.append((avatar_id, dest, os.path.getsize(dest)))
        print(f"Published {avatar_id} -> {dest} ({os.path.getsize(dest) / 1024:.0f} KB)")

    if blocked:
        print("\nBLOCKED (not published):")
        for avatar_id, reason in blocked:
            print(f"  {avatar_id}: {reason}")

    print(f"\n{len(published)} published, {len(blocked)} blocked.")
    if blocked:
        sys.exit(1)


if __name__ == "__main__":
    main()
