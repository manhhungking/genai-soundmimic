import type { AudioExample } from '@genai-fi/classifier';

export const soundIconOptions = [
    { value: 'noise', labelKey: 'sound.wave' },
    { value: 'bird', labelKey: 'sound.bird' },
    { value: 'cat', labelKey: 'sound.cat' },
    { value: 'clap', labelKey: 'sound.clap' },
    { value: 'bell', labelKey: 'sound.bell' },
    { value: 'music', labelKey: 'sound.music' },
] as const;

export type SoundIconKey = (typeof soundIconOptions)[number]['value'];

export type SoundClass = {
    id: string;
    name: string;
    icon: SoundIconKey;
    tone: 'violet' | 'blue' | 'green' | 'orange';
};

export type SoundSample = {
    id: string;
    data: AudioExample;
};

export type SoundSamplesByClass = Record<string, SoundSample[]>;

export const initialSoundClasses: SoundClass[] = [
    { id: 'background-noise', name: 'Background Noise', icon: 'noise', tone: 'violet' },
    { id: 'bird', name: 'Bird', icon: 'bird', tone: 'blue' },
    { id: 'cat', name: 'Cat', icon: 'cat', tone: 'green' },
    { id: 'clap', name: 'Clap', icon: 'clap', tone: 'orange' },
];

export const classTones: SoundClass['tone'][] = ['violet', 'blue', 'green', 'orange'];

export function emptySoundSamples(classes: SoundClass[]): SoundSamplesByClass {
    return Object.fromEntries(classes.map(({ id }) => [id, []]));
}
