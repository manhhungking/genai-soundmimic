import type ClassifierApp from '@genai-fi/classifier';
import type { AudioExample, TeachableModel } from '@genai-fi/classifier';
import type { ISample } from '@genai-fi/classifier/main/ClassifierApp';
import { loadClassifier } from '../../util/classifier';
import { randomId } from '../../util/randomId';
import {
    classTones,
    soundClipIdSeparator,
    soundIconOptions,
    type SoundClass,
    type SoundSample,
    type SoundSamplesByClass,
} from './model';

const recorderOptions = {
    frameSize: 1024,
    sampleRateHz: 44100,
    columnTruncateLength: 232,
    includeRawAudio: true,
    includeCanvas: true,
    warmupMillis: 200,
    overlapFactor: 0,
} as const;

export type SoundPrediction = {
    className: string;
    probability: number;
};

export type SaveSoundClassifierOptions = {
    includeBehaviours: boolean;
    includeSamples: boolean;
    name: string;
};

export const minimumSampleCount = {
    backgroundNoise: 20,
    soundClass: 2,
} as const;

export function hasEnoughSamplesForClass(index: number, samples: SoundSample[]) {
    const requiredSamples = index === 0
        ? minimumSampleCount.backgroundNoise
        : minimumSampleCount.soundClass;
    return samples.length >= requiredSamples;
}

export async function createSoundRecorder() {
    const { SoundRecorder } = await loadClassifier();
    const recorder = new SoundRecorder();
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    recorder.canvas = canvas;
    return recorder;
}

export function recordingOptions(durationMillis?: number, keepSourceAudio = true, deviceId?: string) {
    const options = {
        ...recorderOptions,
        includeRawAudio: keepSourceAudio,
        includeCanvas: keepSourceAudio,
        ...(deviceId ? { deviceId } : {}),
    };
    return durationMillis === undefined ? options : { ...options, durationMillis };
}

export async function extractAudioExamples(
    file: Blob,
    label: string,
    keepSourceAudio = true,
): Promise<AudioExample[]> {
    const recorder = await createSoundRecorder();
    const examples: AudioExample[] = [];

    return new Promise((resolve, reject) => {
        let failed = false;
        recorder.on('example', (example) => examples.push(example));
        recorder.on('error', (error) => {
            failed = true;
            reject(error);
        });
        recorder.on('stop', () => {
            queueMicrotask(() => {
                if (!failed) resolve(examples);
            });
        });
        recorder.startRecording(label, recordingOptions(undefined, keepSourceAudio), file).catch(reject);
    });
}

export function toClassifierSamples(classes: SoundClass[], samples: SoundSamplesByClass): ISample[][] {
    return classes.map(({ id }) => samples[id]?.map((sample) => ({ id: sample.id, data: sample.data })) ?? []);
}

export async function trainSoundClassifier(
    classes: SoundClass[],
    samples: SoundSamplesByClass,
): Promise<ClassifierApp> {
    const { default: ClassifierApp } = await loadClassifier();
    const app = new ClassifierApp('speech', undefined, undefined, toClassifierSamples(classes, samples));
    const model = await app.train(
        classes.map(({ name }) => name),
        app.samples,
        {
            epochs: 50,
            learningRate: 0.001,
            batchSize: 16,
            validationSplit: 0.15,
        },
    );
    if (!model?.isTrained()) throw new Error('Sound classifier training failed');
    return app;
}

export async function loadSoundClassifier(file: Blob): Promise<ClassifierApp> {
    const { default: ClassifierApp } = await loadClassifier();
    const app = await ClassifierApp.load(file);
    if (app.variant !== 'speech' || !app.model?.isTrained()) {
        app.model?.dispose();
        throw new Error('Expected a trained speech classifier');
    }
    return app;
}

export async function saveSoundClassifier(
    app: ClassifierApp,
    classes: SoundClass[],
    samples: SoundSamplesByClass,
    options: SaveSoundClassifierOptions,
): Promise<Blob> {
    if (!app.model?.isTrained()) throw new Error('Expected a trained classifier');

    const metadata = app.model?.getMetadata() as Record<string, unknown> | undefined;
    if (metadata) {
        metadata.soundMimic = {
            version: 2,
            name: options.name,
            classes: classes.map(({ name, icon, tone }) => ({ name, icon, tone })),
        };
    }

    app.model.setName(options.name);
    const { default: ClassifierApp } = await loadClassifier();
    const exportApp = new ClassifierApp(
        app.variant,
        app.model,
        options.includeBehaviours ? app.behaviours : [],
        options.includeSamples ? toClassifierSamples(classes, samples) : [],
    );
    exportApp.projectId = app.projectId;
    return exportApp.save();
}

export function soundClassesFromClassifier(app: ClassifierApp): Pick<SoundClass, 'name' | 'icon' | 'tone'>[] {
    const metadata = app.model?.getMetadata() as Record<string, unknown> | undefined;
    const value = metadata?.soundMimic;
    if (!value || typeof value !== 'object' || !('classes' in value) || !Array.isArray(value.classes)) return [];

    const icons = new Set(soundIconOptions.map(({ value: icon }) => icon));
    const tones = new Set(classTones);
    return value.classes.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const { name, icon, tone } = item as Record<string, unknown>;
        return typeof name === 'string' &&
            typeof icon === 'string' && icons.has(icon as SoundClass['icon']) &&
            typeof tone === 'string' && tones.has(tone as SoundClass['tone'])
            ? [{ name, icon: icon as SoundClass['icon'], tone: tone as SoundClass['tone'] }]
            : [];
    });
}

export function samplesFromClassifier(app: ClassifierApp): SoundSample[][] {
    return app.samples.map((samples) =>
        samples.flatMap((sample) => {
            if (!isAudioExample(sample.data)) return [];
            const id = sample.id || randomId();
            const separatorIndex = id.indexOf(soundClipIdSeparator);
            const clipId = separatorIndex >= 0 ? id.slice(0, separatorIndex) : id;
            return [{ id, clipId, data: sample.data }];
        }),
    );
}

export function canTrainSoundClassifier(classes: SoundClass[], samples: SoundSamplesByClass): boolean {
    return classes.length >= 2 && classes.every(
        ({ id }, index) => hasEnoughSamplesForClass(index, samples[id] ?? []),
    );
}

export async function predictSound(model: TeachableModel, example: AudioExample): Promise<SoundPrediction[]> {
    const result = await model.predict(example);
    return result.predictions;
}

function isAudioExample(value: ISample['data']): value is AudioExample {
    return !(value instanceof HTMLCanvasElement) && 'spectrogram' in value;
}
