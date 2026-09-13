import type { SoundSample } from '../features/training/model';

export type SoundClip = {
    id: string;
    samples: SoundSample[];
};

export function groupSoundSamplesByClip(samples: SoundSample[]): SoundClip[] {
    const clips = new Map<string, SoundSample[]>();
    for (const sample of samples) {
        const clip = clips.get(sample.clipId);
        if (clip) clip.push(sample);
        else clips.set(sample.clipId, [sample]);
    }
    return Array.from(clips, ([id, clipSamples]) => ({ id, samples: clipSamples }));
}
