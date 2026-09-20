import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { AvatarVariant } from '../../data/profile';
import type { GameParticipant, GamePhase } from './model';
import {
    avatarAssetManifest,
    findAvatarMotion,
    requiredAvatarMotions,
    type AvatarMotion,
} from './avatarAssets';

export type AvatarAssetIssue = {
    missingMotions?: AvatarMotion[];
    modelUrl: string;
    variant: AvatarVariant;
};

type StageSceneProps = {
    activePlayerId?: string;
    audioLevel: MutableRefObject<number>;
    onAssetIssues?: (issues: AvatarAssetIssue[]) => void;
    phase: GamePhase;
    players: GameParticipant[];
};

type StagePosition = {
    scale: number;
    x: number;
    z: number;
};

type AvatarActor = {
    actions: Partial<Record<AvatarMotion, THREE.AnimationAction>>;
    currentAction?: THREE.AnimationAction;
    mixer: THREE.AnimationMixer;
    motion?: AvatarMotion;
    root: THREE.Group;
};

const loader = new GLTFLoader();
const assetCache = new Map<AvatarVariant, Promise<GLTF>>();
const floorY = -1.24;
// Everyone records from their waiting spot at once; only the performer walks up to the mic
// afterwards, to play back their clip and see the AI's score.
const activePosition: StagePosition = { scale: 1.05, x: 0.42, z: 0.75 };
const onStagePhases = new Set<GamePhase>(['entering', 'performing', 'result']);

function loadAvatarAsset(variant: AvatarVariant) {
    const cached = assetCache.get(variant);
    if (cached) return cached;
    const request = loader.loadAsync(avatarAssetManifest[variant].modelUrl).catch((error) => {
        // Allow a later retry if assets are deployed while the app is still open.
        assetCache.delete(variant);
        throw error;
    });
    assetCache.set(variant, request);
    return request;
}

function createMaterial(colour: number, roughness = 0.68) {
    return new THREE.MeshStandardMaterial({ color: colour, metalness: 0.16, roughness });
}

function createMesh(geometry: THREE.BufferGeometry, colour: number, roughness?: number) {
    const value = new THREE.Mesh(geometry, createMaterial(colour, roughness));
    value.castShadow = true;
    value.receiveShadow = true;
    return value;
}

function createMicrophone() {
    const group = new THREE.Group();
    const base = createMesh(new THREE.CylinderGeometry(0.3, 0.38, 0.08, 28), 0x17191d, 0.42);
    base.position.y = -1.22;
    const stand = createMesh(new THREE.CylinderGeometry(0.03, 0.042, 1.58, 16), 0x20242a, 0.38);
    stand.position.y = -0.39;
    const neck = new THREE.Group();
    neck.position.y = 0.4;
    neck.rotation.z = -0.24;
    const handle = createMesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 18), 0x24282e, 0.35);
    handle.position.y = 0.11;
    const grille = createMesh(new THREE.SphereGeometry(0.14, 22, 15), 0xb5bbc1, 0.52);
    grille.scale.y = 1.16;
    grille.position.y = 0.34;
    neck.add(handle, grille);
    group.add(base, stand, neck);
    // Original size — pushed well forward of the performer spot (toward the front of the
    // stage/camera) so it reads as clearly in front rather than sitting on the same line.
    group.position.set(1.02, -0.19, 1.42);
    group.scale.setScalar(0.86);
    return group;
}

function waitingPosition(index: number, total: number): StagePosition {
    const frontCount = Math.min(5, total);
    const inBackRow = index >= frontCount;
    const rowIndex = inBackRow ? index - frontCount : index;
    const rowCount = inBackRow ? total - frontCount : frontCount;
    const spacing = rowCount <= 3 ? 0.76 : 0.64;
    const centre = inBackRow ? -1.42 : -1.3;
    const curve = Math.abs(rowIndex - (rowCount - 1) / 2) * 0.045;
    return {
        scale: inBackRow ? 0.78 : 0.86,
        x: centre + (rowIndex - (rowCount - 1) / 2) * spacing,
        // Pulled well behind the mic/performer line so walking up to perform reads as a
        // forward walk with real depth, not a same-line sideways slide.
        z: (inBackRow ? -0.95 : -0.42) - curve,
    };
}

function normalizeAvatar(model: THREE.Group) {
    const initialBounds = new THREE.Box3().setFromObject(model);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    if (initialSize.y > 0) model.scale.setScalar(2.18 / initialSize.y);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const centre = bounds.getCenter(new THREE.Vector3());
    model.position.x -= centre.x;
    model.position.y -= bounds.min.y;
    model.position.z -= centre.z;
}

function createActor(gltf: GLTF): { actor: AvatarActor; missingMotions: AvatarMotion[] } {
    const model = clone(gltf.scene) as THREE.Group;
    normalizeAvatar(model);
    model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
    });

    const root = new THREE.Group();
    root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions: Partial<Record<AvatarMotion, THREE.AnimationAction>> = {};
    for (const clip of gltf.animations) {
        const motion = findAvatarMotion(clip.name);
        if (motion && !actions[motion]) actions[motion] = mixer.clipAction(clip);
    }

    return {
        actor: { actions, mixer, root },
        missingMotions: requiredAvatarMotions.filter((motion) => !actions[motion]),
    };
}

function transitionTo(actor: AvatarActor, motion: AvatarMotion, reducedMotion: boolean) {
    const action = actor.actions[motion] ?? actor.actions.idle;
    if (!action || (actor.motion === motion && actor.currentAction === action)) return;
    action.enabled = true;
    action.reset().setEffectiveWeight(1).play();
    if (actor.currentAction && actor.currentAction !== action) {
        actor.currentAction.crossFadeTo(action, reducedMotion ? 0.05 : 0.3, true);
    } else {
        action.fadeIn(reducedMotion ? 0.05 : 0.3);
    }
    actor.currentAction = action;
    actor.motion = motion;
}

export default function StageScene({
    activePlayerId,
    audioLevel,
    onAssetIssues,
    phase,
    players,
}: StageSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerKey = players.filter(({ connected }) => connected)
        .map(({ avatar, id }) => `${id}:${avatar}`)
        .join('|');
    // Rebuild only when player identities or avatar selections change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const scenePlayers = useMemo(() => players.filter(({ connected }) => connected), [playerKey]);
    const stateRef = useRef({ activePlayerId, phase, players: scenePlayers });

    useEffect(() => {
        stateRef.current = { activePlayerId, phase, players: scenePlayers };
    }, [activePlayerId, phase, scenePlayers]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof window.WebGLRenderingContext === 'undefined') return;
        let cancelled = false;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-4.8, 4.8, 2.7, -2.7, 0.1, 100);
        // Tilted down noticeably more than before: an orthographic camera has no perspective
        // foreshortening, so a near-flat angle (as this used to be) makes forward/backward (z)
        // movement almost invisible — nothing to walk "toward". A real downward tilt turns z
        // into actual vertical screen movement, so walking to the mic reads as a diagonal walk
        // forward instead of a sideways slide with the character just growing in place.
        camera.position.set(0, 1.9, 8.1);
        camera.lookAt(0, -0.75, 0);
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setClearAlpha(0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.append(renderer.domElement);

        // A plain DOM layer for name tags, positioned every frame by projecting each
        // character's head into screen space — simpler and crisper than sprites baked into
        // the WebGL scene, and it stays legible at any zoom/DPI.
        const labelLayer = document.createElement('div');
        labelLayer.className = 'stage-name-tags';
        container.append(labelLayer);
        const labels = new Map<string, HTMLDivElement>();
        const headPoint = new THREE.Vector3();

        scene.add(new THREE.HemisphereLight(0xffe4bd, 0x4c261e, 2.1));
        const spot = new THREE.SpotLight(0xffc66f, 42, 15, Math.PI / 5.4, 0.72, 1.35);
        spot.position.set(1.15, 5.2, 4.7);
        spot.target.position.set(0.62, floorY, 0.08);
        spot.castShadow = true;
        scene.add(spot, spot.target);
        const fill = new THREE.DirectionalLight(0x8cc8ff, 1.15);
        fill.position.set(-4, 3, 5);
        scene.add(fill);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 7),
            new THREE.ShadowMaterial({ color: 0x120707, opacity: 0.28 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, floorY, 0);
        floor.receiveShadow = true;
        const microphone = createMicrophone();
        scene.add(floor, microphone);

        const actors = new Map<string, AvatarActor>();
        void Promise.all(scenePlayers.map(async (player, index): Promise<AvatarAssetIssue | undefined> => {
            const definition = avatarAssetManifest[player.avatar];
            try {
                const gltf = await loadAvatarAsset(player.avatar);
                if (cancelled) return undefined;
                const { actor, missingMotions } = createActor(gltf);
                const position = waitingPosition(index, scenePlayers.length);
                actor.root.position.set(position.x, floorY, position.z);
                actor.root.scale.setScalar(position.scale);
                actors.set(player.id, actor);
                scene.add(actor.root);
                transitionTo(actor, 'idle', false);
                const label = document.createElement('div');
                label.className = 'stage-name-tag';
                label.textContent = player.name;
                labelLayer.append(label);
                labels.set(player.id, label);
                return missingMotions.length
                    ? { missingMotions, modelUrl: definition.modelUrl, variant: player.avatar }
                    : undefined;
            } catch {
                return { modelUrl: definition.modelUrl, variant: player.avatar };
            }
        })).then((issues) => {
            if (!cancelled) onAssetIssues?.(issues.filter((issue): issue is AvatarAssetIssue => !!issue));
        });

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const timer = new THREE.Timer();
        timer.connect(document);
        let frame = 0;

        const resize = () => {
            const { clientHeight, clientWidth } = container;
            if (!clientWidth || !clientHeight) return;
            const aspect = clientWidth / clientHeight;
            const height = 5.25;
            camera.left = -(height * aspect) / 2;
            camera.right = (height * aspect) / 2;
            camera.top = height / 2;
            camera.bottom = -height / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight, false);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();

        const animate = (timestamp: number) => {
            timer.update(timestamp);
            const delta = Math.min(timer.getDelta(), 0.05);
            const current = stateRef.current;
            current.players.forEach((player, index) => {
                const actor = actors.get(player.id);
                if (!actor) return;
                const active = current.activePlayerId === player.id && onStagePhases.has(current.phase);
                const target = active ? activePosition : waitingPosition(index, current.players.length);
                const moveFactor = 1 - Math.exp(-delta * (reducedMotion ? 15 : 4.8));
                const distance = Math.hypot(target.x - actor.root.position.x, target.z - actor.root.position.z);
                actor.root.position.x += (target.x - actor.root.position.x) * moveFactor;
                actor.root.position.z += (target.z - actor.root.position.z) * moveFactor;
                const nextScale = actor.root.scale.x + (target.scale - actor.root.scale.x) * moveFactor;
                actor.root.scale.setScalar(nextScale);

                const lookingAtPerformer = !!current.activePlayerId && !active && onStagePhases.has(current.phase);
                const targetRotation = lookingAtPerformer ? -0.2 : active ? 0.08 : 0;
                actor.root.rotation.y += (targetRotation - actor.root.rotation.y) * moveFactor;

                const performing = active && current.phase === 'performing';
                const motion: AvatarMotion = distance > 0.035 ? 'walk' : performing ? 'perform' : 'idle';
                transitionTo(actor, motion, reducedMotion);
                const performAction = actor.actions.perform;
                if (performAction) performAction.timeScale = performing
                    ? 0.82 + Math.min(1, audioLevel.current) * 0.8
                    : 1;
                actor.mixer.update(delta);

                const label = labels.get(player.id);
                if (label) {
                    headPoint.set(actor.root.position.x, floorY + 2.18 * actor.root.scale.x + 0.14, actor.root.position.z);
                    headPoint.project(camera);
                    if (headPoint.z > 1) {
                        label.style.display = 'none';
                    } else {
                        label.style.display = '';
                        const xPx = (headPoint.x * 0.5 + 0.5) * container.clientWidth;
                        const yPx = (1 - (headPoint.y * 0.5 + 0.5)) * container.clientHeight;
                        label.style.transform = `translate(-50%, -100%) translate(${xPx}px, ${yPx}px)`;
                    }
                }
            });
            renderer.render(scene, camera);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            timer.dispose();
            observer.disconnect();
            actors.forEach(({ mixer, root }) => {
                mixer.stopAllAction();
                scene.remove(root);
            });
            floor.geometry.dispose();
            (floor.material as THREE.Material).dispose();
            microphone.traverse((object) => {
                if (!(object instanceof THREE.Mesh)) return;
                object.geometry.dispose();
                if (Array.isArray(object.material)) object.material.forEach((value) => value.dispose());
                else object.material.dispose();
            });
            renderer.dispose();
            renderer.domElement.remove();
            labelLayer.remove();
        };
    }, [audioLevel, onAssetIssues, playerKey, scenePlayers]);

    return <div aria-hidden="true" className="play-stage__three" ref={containerRef} />;
}
