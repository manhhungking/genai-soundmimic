import { describe, expect, it } from 'vitest';
import { avatarOptions } from '../../data/profile';
import { avatarAssetManifest, findAvatarMotion } from './avatarAssets';

describe('play avatar assets', () => {
    it('declares a rigged GLB for every selectable avatar', () => {
        expect(Object.keys(avatarAssetManifest).sort()).toEqual([...avatarOptions].sort());
        for (const avatar of avatarOptions) {
            expect(avatarAssetManifest[avatar].modelUrl).toBe(`/assets/avatars/${avatar}.glb`);
        }
    });

    it('accepts common animation clip names', () => {
        expect(findAvatarMotion('Idle_Loop')).toBe('idle');
        expect(findAvatarMotion('Walking Forward')).toBe('walk');
        expect(findAvatarMotion('Talk-Performance')).toBe('perform');
    });
});
