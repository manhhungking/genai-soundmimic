import type { AvatarVariant } from '../../data/profile';

export type AvatarMotion = 'idle' | 'perform' | 'walk';

export type AvatarAssetDefinition = {
    modelUrl: string;
};

export const requiredAvatarMotions: AvatarMotion[] = ['idle', 'walk', 'perform'];

export const avatarAssetManifest: Record<AvatarVariant, AvatarAssetDefinition> = {
    aisha: { modelUrl: '/assets/avatars/aisha.glb' },
    emma: { modelUrl: '/assets/avatars/emma.glb' },
    hana: { modelUrl: '/assets/avatars/hana.glb' },
    hung: { modelUrl: '/assets/avatars/hung.glb' },
    kai: { modelUrl: '/assets/avatars/kai.glb' },
    leo: { modelUrl: '/assets/avatars/leo.glb' },
    liam: { modelUrl: '/assets/avatars/liam.glb' },
    maya: { modelUrl: '/assets/avatars/maya.glb' },
    noah: { modelUrl: '/assets/avatars/noah.glb' },
    zoe: { modelUrl: '/assets/avatars/zoe.glb' },
};

const motionAliases: Record<AvatarMotion, string[]> = {
    idle: ['idle', 'standing', 'wait'],
    walk: ['walk', 'walking'],
    perform: ['perform', 'speaking', 'speak', 'talking', 'talk', 'singing', 'sing', 'dance'],
};

export function findAvatarMotion(name: string): AvatarMotion | undefined {
    const normalizedName = name.toLowerCase().replace(/[\s_.-]/g, '');
    return requiredAvatarMotions.find((motion) => motionAliases[motion].some((alias) => (
        normalizedName.includes(alias)
    )));
}
