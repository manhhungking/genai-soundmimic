import type ClassifierApp from '@genai-fi/classifier';
import type { AudioExample, TeachableModel } from '@genai-fi/classifier';
import type { ISample } from '@genai-fi/classifier/main/ClassifierApp';
import { loadClassifier, randomId } from '../../shared/genai';
import {
    classTones,
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
    overlapFactor: 0.5,
} as const;

export type SoundPrediction = {
    className: string;
    probability: number;
};

export async function createSoundRecorder() {
    const { SoundRecorder } = await loadClassifier();
    return new SoundRecorder();
}

export function recordingOptions(durationMillis = 20_000, keepSourceAudio = true) {
    return {
        ...recorderOptions,
        durationMillis,
        includeRawAudio: keepSourceAudio,
        includeCanvas: keepSourceAudio,
    };
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
        recorder.startRecording(label, recordingOptions(20_000, keepSourceAudio), file).catch(reject);
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
): Promise<Blob> {
    const metadata = app.model?.getMetadata() as Record<string, unknown> | undefined;
    if (metadata) {
        metadata.soundMimic = {
            version: 1,
            classes: classes.map(({ name, icon, tone }) => ({ name, icon, tone })),
        };
    }
    app.samples = toClassifierSamples(classes, samples);
    return app.save();
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
        samples.flatMap((sample) => isAudioExample(sample.data) ? [{ id: sample.id || randomId(), data: sample.data }] : []),
    );
}

export function canTrainSoundClassifier(classes: SoundClass[], samples: SoundSamplesByClass): boolean {
    return classes.length >= 2 && classes.every(
        ({ id }, index) => (samples[id]?.length ?? 0) >= (index === 0 ? 20 : 2),
    );
}

export async function predictSound(model: TeachableModel, example: AudioExample): Promise<SoundPrediction[]> {
    const result = await model.predict(example);
    return result.predictions;
}

function isAudioExample(value: ISample['data']): value is AudioExample {
    return !(value instanceof HTMLCanvasElement) && 'spectrogram' in value;
}
