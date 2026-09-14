// Independent verification of staged avatar GLBs using the app's own GLTFLoader
// (three.js), NOT just re-checking they exist. Run after scripts/avatars/build.py:
//
//   node scripts/avatars/verify_glb.mjs [id ...]   (defaults to all 10)
//
// For each file this loads the *actual* glTF scene graph and reports:
//   - mesh count, total triangles
//   - whether a SkinnedMesh + skeleton (bones) is present
//   - animation clip names + duration + whether the first/last frame pose match
//     closely enough to loop without a visible pop
//   - morph target ("shape key") names, if any
// It does not render pixels — see docs/avatars/previews/{id}-*.png for the visual
// comparison against the character sheets, done separately by eye.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const STAGING_DIR = path.join(REPO_ROOT, '.build-staging', 'avatars');

const ALL_IDS = ['leo', 'liam', 'noah', 'kai', 'hung', 'hana', 'zoe', 'aisha', 'emma', 'maya'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL_IDS;

function loadGlb(filePath) {
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.parse(arrayBuffer, '', resolve, reject);
    });
}

function countTriangles(root) {
    let tris = 0;
    let meshes = 0;
    let skinned = 0;
    let bones = 0;
    let morphTargets = new Set();
    root.traverse((obj) => {
        if (obj.isMesh) {
            meshes += 1;
            const geo = obj.geometry;
            const idx = geo.index;
            tris += idx ? idx.count / 3 : geo.attributes.position.count / 3;
            if (obj.isSkinnedMesh) {
                skinned += 1;
                bones = Math.max(bones, obj.skeleton ? obj.skeleton.bones.length : 0);
            }
            if (obj.morphTargetDictionary) {
                Object.keys(obj.morphTargetDictionary).forEach((k) => morphTargets.add(k));
            }
        }
    });
    return { meshes, tris, skinned, bones, morphTargets: [...morphTargets] };
}

function analyzeClip(clip) {
    // Sample every track at t=0 and t=duration and compare, as a cheap loop-quality check
    // (a well-authored loop should start/end at (near-)identical poses).
    let maxDelta = 0;
    for (const track of clip.tracks) {
        const stride = track.getValueSize();
        const n = track.times.length;
        if (n < 2) continue;
        const first = track.values.slice(0, stride);
        const last = track.values.slice((n - 1) * stride, n * stride);
        for (let i = 0; i < stride; i += 1) {
            maxDelta = Math.max(maxDelta, Math.abs(first[i] - last[i]));
        }
    }
    return { name: clip.name, duration: clip.duration, tracks: clip.tracks.length, maxLoopDelta: maxDelta };
}

const results = [];
for (const id of ids) {
    const filePath = path.join(STAGING_DIR, `${id}.glb`);
    if (!fs.existsSync(filePath)) {
        results.push({ id, status: 'missing_staged_file' });
        console.log(`${id}: MISSING at ${filePath}`);
        continue;
    }
    const sizeBytes = fs.statSync(filePath).size;
    try {
        const gltf = await loadGlb(filePath);
        const stats = countTriangles(gltf.scene);
        const clips = (gltf.animations || []).map(analyzeClip);
        const clipNames = clips.map((c) => c.name).sort();
        const expected = ['idle', 'perform', 'walk'];
        const hasAllClips = expected.every((n) => clipNames.includes(n));
        const record = {
            id,
            status: 'loaded_ok',
            sizeBytes,
            meshes: stats.meshes,
            triangles: Math.round(stats.tris),
            hasSkinnedMesh: stats.skinned > 0,
            boneCount: stats.bones,
            morphTargets: stats.morphTargets,
            clips,
            hasAllRequiredClips: hasAllClips,
        };
        results.push(record);
        console.log(
            `${id}: OK  size=${(sizeBytes / 1024).toFixed(0)}KB  meshes=${stats.meshes}  tris=${record.triangles}  `
            + `skinned=${stats.skinned > 0}  bones=${stats.bones}  morphs=[${stats.morphTargets.join(',')}]  `
            + `clips=${clipNames.join(',')}  loopDeltas=${clips.map((c) => `${c.name}:${c.maxLoopDelta.toFixed(4)}`).join(' ')}`,
        );
        if (!hasAllClips) console.log(`  !! MISSING required clip(s) for ${id}: expected ${expected}, got ${clipNames}`);
    } catch (err) {
        results.push({ id, status: 'load_error', error: String(err) });
        console.log(`${id}: LOAD ERROR — ${err}`);
    }
}

const outPath = path.join(__dirname, '_verify_result.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nWrote ${outPath}`);

const failed = results.filter((r) => r.status !== 'loaded_ok' || !r.hasAllRequiredClips);
if (failed.length) {
    console.log(`\n${failed.length} avatar(s) FAILED verification: ${failed.map((f) => f.id).join(', ')}`);
    process.exitCode = 1;
} else {
    console.log(`\nAll ${results.length} avatars passed independent GLTFLoader verification.`);
}
