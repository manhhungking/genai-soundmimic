import type ClassifierApp from '@genai-fi/classifier';
import type { AudioExample } from '@genai-fi/classifier';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialSoundClasses, type SoundSamplesByClass } from './model';
import { saveSoundClassifier } from './soundClassifier';

const classifierMocks = vi.hoisted(() => ({
    constructorArguments: [] as unknown[][],
    save: vi.fn(async () => new Blob(['classifier'])),
}));

vi.mock('../../util/classifier', () => ({
    loadClassifier: vi.fn(async () => ({
        default: class MockClassifierApp {
            projectId?: string;

            constructor(...args: unknown[]) {
                classifierMocks.constructorArguments.push(args);
            }

            save = classifierMocks.save;
        },
    })),
}));

const example: AudioExample = {
    label: 'Bird',
    spectrogram: { data: new Float32Array([0.2]), frameSize: 232 },
    rawAudio: { data: new Float32Array([0.1]), sampleRateHz: 44_100 },
};

describe('sound classifier saving', () => {
    beforeEach(() => {
        classifierMocks.constructorArguments.length = 0;
        classifierMocks.save.mockClear();
    });

    it('builds a separate export app with only the selected contents', async () => {
        const metadata: Record<string, unknown> = {};
        const setName = vi.fn();
        const originalSamples: SoundSamplesByClass = {
            'background-noise': [],
            bird: [{ id: 'bird-1', clipId: 'bird-recording', data: example }],
            cat: [],
            clap: [],
        };
        const app = {
            behaviours: [{ type: 'example-behaviour' }],
            model: {
                getMetadata: () => metadata,
                isTrained: () => true,
                setName,
            },
            projectId: 'classroom-code',
            samples: [['original-sample']],
            variant: 'speech',
        } as unknown as ClassifierApp;

        const blob = await saveSoundClassifier(app, initialSoundClasses, originalSamples, {
            includeBehaviours: false,
            includeSamples: false,
            name: 'Bird Lab',
        });

        expect(blob).toBeInstanceOf(Blob);
        expect(setName).toHaveBeenCalledWith('Bird Lab');
        expect(metadata.soundMimic).toMatchObject({
            name: 'Bird Lab',
            version: 2,
            classes: initialSoundClasses.map(({ name, icon, tone }) => ({ name, icon, tone })),
        });
        expect(classifierMocks.constructorArguments[0]).toEqual([
            'speech',
            app.model,
            [],
            [],
        ]);
        expect(app.samples).toEqual([['original-sample']]);
        expect(classifierMocks.save).toHaveBeenCalledOnce();
    });
});
