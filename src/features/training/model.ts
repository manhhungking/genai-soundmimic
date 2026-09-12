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
    sampleCount: number;
    tone: 'violet' | 'blue' | 'green' | 'orange';
};

export const initialSoundClasses: SoundClass[] = [
    { id: 'background-noise', name: 'Background Noise', icon: 'noise', sampleCount: 8, tone: 'violet' },
    { id: 'bird', name: 'Bird', icon: 'bird', sampleCount: 10, tone: 'blue' },
    { id: 'cat', name: 'Cat', icon: 'cat', sampleCount: 7, tone: 'green' },
    { id: 'clap', name: 'Clap', icon: 'clap', sampleCount: 6, tone: 'orange' },
];

export const classTones: SoundClass['tone'][] = ['violet', 'blue', 'green', 'orange'];
