# SoundMimic avatars — build report

**Date:** 2026-09-15
**Pipeline:** `scripts/avatars/build.py` (Blender 5.2.1 LTS, Python, `bpy`) — procedural
mesh + humanoid armature + automatic skinning + 3 baked animation clips + morph targets,
exported to glTF/GLB. Verified with `scripts/avatars/verify_glb.mjs` (three.js
`GLTFLoader`, the same loader class the app uses) before publishing with
`scripts/avatars/publish.py`.

**Read this first:** the geometry here is **procedurally generated from primitives in
Blender Python**, not hand-sculpted from the character sheets by an artist. It reuses one
shared humanoid rig/skeleton across all 10 characters and differentiates them by color,
hairstyle silhouette, and swappable accessories/clothing pieces. It is real, working,
rigged, animated geometry — not a capsule/dummy, not a flat image on a plane — but it
reads visually as a simplified "toy figure," not the soft, painted, semi-realistic style
of the character sheets. See §3 for the honest per-character design-match assessment.

---

## 1. Pipeline check (before rebuilding)

- Blender was not installed; installed via `brew install --cask blender` → **5.2.1 LTS**,
  confirmed runnable headless (`blender --background --python ...`).
- Existing `hung.glb` (from an earlier session) was inspected directly (raw glTF JSON
  chunk, no external tools): 13 meshes, 12 materials, 1 skin, 19 bones, clips
  `idle`/`walk`/`perform`, 0 images/textures. Same pipeline (`scripts/avatars/build.py`)
  produced it — reused and improved it rather than starting over.
- Three real bugs were found and fixed while reviewing the pipeline before this rebuild
  (all three affect visual correctness, not just polish):
  1. **Missing sleeves.** Six characters (Leo, Noah, Kai, Zoe, Maya, Emma) had a torso
     garment but no sleeve geometry at all — bare skin-colored arms under a hoodie.
     Fixed with a generic `sleeve` config (`long/short`, configurable color) applied to
     every character.
  2. **Invisible contrast sleeve.** Liam's blue sleeve-over-white-torso was built as a
     separate mesh but then joined into the torso mesh and painted with the single torso
     material, discarding the blue. Fixed by keeping sleeves as their own mesh/material
     instead of merging multi-color parts into one mesh with one `assign_material()` call.
  3. **Invisible denim bib.** Aisha's and Hana's overalls bib+straps were joined into the
     same mesh as the underlying shirt and painted with the shirt's single color, so the
     denim never showed. Same fix pattern: separate mesh, separate material.
  4. (Minor, pre-existing) Maya's `hoodie_closed_heart` style computed a `heart_color`
     variable but never built the heart mesh — dead code, no heart logo. Implemented a
     real parametric heart-curve mesh and placed it on the chest.
  5. (Cosmetic only) QA preview stills were rendering a blended NLA pose instead of the
     rest pose (clearing `animation_data.action` doesn't stop pushed-down NLA tracks from
     still influencing the armature) — fixed by forcing `pose_position = 'REST'` for the
     render step, done *after* GLB export so the exported animation data was never
     affected.

## 2. Technical completion (per avatar)

All 10 rebuilt from scratch this session (Hung included, not skipped). Every file below
has: a full-body mesh with materials, a real humanoid `Armature` (19 bones: hips/spine/
chest/neck/head, L+R shoulder/upper-arm/forearm/hand, L+R upper-leg/lower-leg/foot),
automatic-weight skinning, exactly the 3 required animation clips named `idle`/`walk`/
`perform`, and `MouthOpen`+`Blink` morph targets. Origin at floor level between the feet,
+Y-up on export, consistent scale/facing across all 10.

| ID | File size | Triangles | Bones | Clips | Morphs | Loader parse |
|---|---|---|---|---|---|---|
| leo | 1400 KB | 36,424 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| liam | 1474 KB | 39,936 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| noah | 1609 KB | 42,504 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| kai | 1416 KB | 37,044 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| hung | 1641 KB | 43,348 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| hana | 1340 KB | 35,624 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| zoe | 1188 KB | 30,208 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| aisha | 1889 KB | 50,688 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| emma | 1231 KB | 32,380 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |
| maya | 1279 KB | 33,812 | 19 | idle, walk, perform | MouthOpen, Blink | ✅ |

**What "✅ Loader parse" actually means:** `scripts/avatars/verify_glb.mjs` loads each
`.glb` with `three.js`'s `GLTFLoader` (the same loader class this app's runtime would
use) independently of Blender, and confirms: the scene parses without error, a
`SkinnedMesh` + skeleton is present, all 3 required clip names exist, and — for every
clip — the first and last keyframe pose match exactly (`maxLoopDelta: 0.0000` on all 30
clip checks), meaning none of them will visibly pop when looped. Raw data:
`scripts/avatars/_verify_result.json`.

**What was *not* verified:**
- Behavior inside the actual running SoundMimic 3D stage (`PlayStage`/`StageScene`,
  `useAudioPerformance`) — only an isolated GLTFLoader parse, not the app's render path,
  multi-avatar-at-once scene, or camera/animation blending logic.
- Frame-by-frame clipping/interpenetration across the full walk/perform cycles for all 10
  — spot-checked visually via the front/side/back stills in `docs/avatars/previews/`
  (which capture the rest pose, not mid-animation frames), not reviewed frame-by-frame.
- Real-world performance/FPS on target hardware.
- `wave`, `cheer`, `thinking` — optional per spec, not built.

**Textures:** none. All materials are flat Principled BSDF base colors (measured from
each character sheet's palette swatch) — no baked/photographic textures. This keeps file
size small and avoids any embedded-texture export issues, but means fine detail (fabric
texture, hair strands, skin shading) that the painted character sheets have is entirely
absent.

**Hands:** simplified "mitt" capsules, no individual fingers — an explicitly allowed
simplification per the Hung character sheet ("Full fingers (simplified ok)").

## 3. Design match vs. the character sheets (honest, per avatar)

Every character carries the right **identity signal** — hair color, top color/style,
locked accessory — matching `docs/avatars/AVATAR_SPEC.md`'s locked list. None of the 10
are a recolor of a single base model wearing different-colored clothes with nothing else
changed: hairstyle silhouette (short/long/curly/wavy), clothing structure (hoodie vs.
overalls vs. open-hoodie-over-tee), and accessory geometry (cap, headphones-at-neck vs.
on-head, glasses, headband, bear-beanie) are each genuinely different construction, not
just a palette swap.

What does **not** match the painted character sheets: overall fidelity. The renders read
as a simplified geometric "toy figure" — cylindrical limbs, a spherical head, blocky
mitt hands, minimal facial sculpting (no nose bridge shape, no cheek volume, thin
eyebrow strips) — not the soft, shaded, semi-realistic 3D-cartoon style of the sheets.
That gap is inherent to a from-primitives procedural pipeline and would need actual
character sculpting/retopology (e.g. a real DCC sculpt-and-rig pass, or a licensed base
mesh) to close, which is outside what this session's toolset (Blender Python primitives)
can produce.

Per-character notes (see `docs/avatars/previews/{id}-front.png` for the actual render):

- **Leo** — brown short/swoop hair ✅, blue closed hoodie with full sleeves ✅, no
  accessory ✅. Good identity match.
- **Liam** — blonde messy hair ✅, white torso with contrast **blue** long sleeves ✅
  (this is the bug fixed in §1.2 — previously invisible), dark headphones-at-neck ✅
  (small dark spheres + band, reads correctly at neck height, distinct from Maya's
  on-head placement).
- **Noah** — brown skin tone ✅, dark curly-clump hair silhouette (reads as "short curly,"
  not a fully convincing curl pattern up close) ✅ approximately, green closed hoodie
  with sleeves ✅.
- **Kai** — orange/red hair ✅, red hoodie with sleeves ✅; the blue-and-white cap is
  present but its brim reads faintly in the front render — legible from the side
  (`kai-side.png`), weak from the front. Worth a follow-up geometry tweak (bigger/lower
  brim) before calling it fully sheet-accurate.
- **Hung** — black side-part hair ✅, blue hoodie **open** over a white tee with a
  five-point blue star on the chest ✅, full sleeves over the tee ✅, cargo pants ✅, **no
  hat** ✅ (explicitly required this task — confirmed absent).
- **Hana** — long straight brown hair (mostly hidden under the beanie, as intended) ✅,
  cream beanie present but the bear-face/ear detailing is minimal (two small light-brown
  spheres, no embroidered face) — reads as "a light beanie," not distinctly "a bear
  beanie" from the front alone. Denim bib+straps now visible (§1.3 fix) but the straps
  read more clearly than the bib panel itself, which sits close to the shirt and is easy
  to miss at a glance.
- **Zoe** — blonde long-wavy hair ✅, coral hoodie with sleeves ✅, blue jeans ✅. One of
  the stronger identity matches.
- **Aisha** — brown skin tone ✅, curly-clump long hair silhouette (approximate, same
  caveat as Noah) ✅, yellow headband ✅, yellow short-sleeve top ✅, denim
  bib+straps+pants ✅ (bib visibility same caveat as Hana).
- **Emma** — orange/red long-wavy hair ✅, yellow hoodie with sleeves ✅, round dark
  glasses present as a thin ring — legible but delicate, could be thickened for
  readability at small (thumbnail) scale.
- **Maya** — black long-straight hair ✅, purple hoodie with sleeves ✅, small white heart
  logo on the chest now actually present (§1.4 fix) ✅, purple on-head headphones ✅. One
  of the stronger identity matches.

## 4. Manifest

`docs/avatars/avatar-manifest.json` updated for all 10: `assets.glb` now points at the
published `public/assets/avatars/{id}.glb` with `status: "verified"` plus its measured
size/triangle/bone/clip/morph data; `assets.qaRenders` points at
`docs/avatars/previews/{id}-{front,side,back}.png`; `assets.blendSource` points at
`assets-src/avatars/{id}/{id}.blend`; `runtimeVerification` records exactly what was and
wasn't checked (§2). Top-level `status` changed from `design_specification_only` to
`assets_generated_and_verified` with a note reiterating the procedural-vs-hand-sculpted
distinction so a future reader doesn't mistake "verified" for "matches the concept art."

## 5. Files touched

```
public/assets/avatars/{leo,liam,noah,kai,hung,hana,zoe,aisha,emma,maya}.glb   (published)
assets-src/avatars/{id}/{id}.blend                                            (10 files)
docs/avatars/previews/{id}-{front,side,back}.png                             (30 files)
docs/avatars/avatar-manifest.json                                            (updated)
docs/avatars/BUILD_REPORT.md                                                 (this file)
scripts/avatars/build.py                                                    (fixed + extended)
scripts/avatars/verify_glb.mjs                                              (new)
scripts/avatars/publish.py                                                  (new)
```

Nothing under `docs/avatars/references/` or `public/assets/avatars/thumbnails/` was
touched, per the task's instruction not to regenerate character sheets or thumbnails.
`.build-staging/` (git-ignored) holds the pre-publish staged GLBs; `publish.py` refuses
to copy any avatar into `public/` that isn't recorded as `loaded_ok` with all 3 clips in
`scripts/avatars/_verify_result.json`.
