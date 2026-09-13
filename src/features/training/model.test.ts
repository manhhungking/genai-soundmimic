import type { AudioExample } from '@genai-fi/classifier';
import { describe, expect, it } from 'vitest';
import { groupSoundSamplesByClip } from '../../util/soundSamples';
import { initialSoundClasses, type SoundSample } from './model';
import {
    canTrainSoundClassifier,
    hasEnoughSamplesForClass,
    minimumSampleCount,
    recordingOptions,
} from './soundClassifier';

function createSample(id: string, clipId: string): SoundSample {
    return {
        id,
        clipId,
        data: {
            label: 'Bird',
            spectrogram: { data: new Float32Array(0), frameSize: 232 },
            rawAudio: { data: new Float32Array([0, 0.5, -0.25]), sampleRateHz: 44_100 },
        } satisfies AudioExample,
    };
}

describe('sound recording clips', () => {
    it('groups all classifier frames from one recording into one clip', () => {
        const clips = groupSoundSamplesByClip([
            createSample('frame-1', 'recording-1'),
            createSample('frame-2', 'recording-1'),
            createSample('frame-3', 'recording-2'),
        ]);

        expect(clips).toHaveLength(2);
        expect(clips[0].samples).toHaveLength(2);
        expect(clips[1].samples).toHaveLength(1);
    });

    it('records non-overlapping frames until the user stops', () => {
        const options = recordingOptions();

        expect(options.overlapFactor).toBe(0);
        expect(options).not.toHaveProperty('durationMillis');
    });

    it('passes the selected microphone to the sound recorder', () => {
        expect(recordingOptions(undefined, false, 'usb-microphone')).toMatchObject({
            deviceId: 'usb-microphone',
            includeCanvas: false,
            includeRawAudio: false,
        });
    });

    it('requires two samples before activating a regular sound class', () => {
        const samples = [
            createSample('frame-1', 'recording-1'),
            createSample('frame-2', 'recording-2'),
        ];

        expect(hasEnoughSamplesForClass(1, samples.slice(0, 1))).toBe(false);
        expect(hasEnoughSamplesForClass(1, samples)).toBe(true);
        expect(minimumSampleCount.soundClass).toBe(2);
    });

    it('keeps the classifier inactive until every class reaches its threshold', () => {
        const samples = Object.fromEntries(initialSoundClasses.map(({ id }, index) => [
            id,
            Array.from(
                { length: index === 0 ? minimumSampleCount.backgroundNoise : minimumSampleCount.soundClass },
                (_, sampleIndex) => createSample(`${id}-${sampleIndex}`, `${id}-recording-${sampleIndex}`),
            ),
        ]));

        expect(hasEnoughSamplesForClass(0, samples['background-noise'].slice(0, -1))).toBe(false);
        expect(canTrainSoundClassifier(initialSoundClasses, {
            ...samples,
            bird: samples.bird.slice(0, 1),
        })).toBe(false);
        expect(canTrainSoundClassifier(initialSoundClasses, samples)).toBe(true);
    });
});
