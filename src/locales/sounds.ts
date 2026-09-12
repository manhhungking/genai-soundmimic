import type { TranslationKey } from './en';

const soundNameKeys: Record<string, TranslationKey> = {
    'Background Noise': 'sound.backgroundNoise',
    Bird: 'sound.bird',
    Cat: 'sound.cat',
    Clap: 'sound.clap',
    Bell: 'sound.bell',
    Music: 'sound.music',
};

export function getSoundNameKey(name: string) {
    return soundNameKeys[name];
}
