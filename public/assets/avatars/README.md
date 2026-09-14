# SoundMimic rigged avatar assets

Place one production-ready GLB file here for each profile avatar:

- `leo.glb`
- `maya.glb`
- `noah.glb`
- `emma.glb`
- `kai.glb`
- `zoe.glb`
- `liam.glb`
- `hana.glb`
- `aisha.glb`
- `hung.glb`

Each GLB must contain a full-body, rigged character and animation clips whose names include:

- `Idle`
- `Walk`
- `Perform`, `Speak`, `Talk`, `Sing`, or `Dance`

Models should face the positive Z direction, use metres, keep their feet at the model origin, and include no lights or cameras. The stage normalizes every model to the same child-height and blends the three motions at runtime.

See `reference/` for character design sheets (turnarounds, expressions, rig topology) used as the visual brief for modeling these avatars.
