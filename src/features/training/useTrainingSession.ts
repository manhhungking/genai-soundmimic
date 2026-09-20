import type ClassifierApp from '@genai-fi/classifier';
import type { AudioExample } from '@genai-fi/classifier';
import { useMemo, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { SaveModelSelection } from './SaveModelDialog';
import type { TrainingStatus } from './TrainingStage';
import { clearActiveSoundClassifier, setActiveSoundClassifier } from './activeClassifier';
import {
    classTones,
    emptySoundSamples,
    soundClipIdSeparator,
    initialSoundClasses,
    soundIconOptions,
    type SoundClass,
    type SoundSamplesByClass,
} from './model';
import {
    canTrainSoundClassifier,
    loadSoundClassifier,
    predictSound,
    samplesFromClassifier,
    saveSoundClassifier,
    soundClassesFromClassifier,
    trainSoundClassifier,
    type SoundPrediction,
} from './soundClassifier';
import { randomId } from '../../util/randomId';

/**
 * Owns the sound-classifier training state (classes, samples, trained model, status).
 * Instantiated once at the app-shell level (see AppLayout) so it survives navigation
 * between /train, /setup, /play, etc. — only a full page reload clears it.
 */
export function useTrainingSession() {
    const { t } = useTranslation();
    const [classes, setClasses] = useState<SoundClass[]>(initialSoundClasses);
    const [samples, setSamples] = useState<SoundSamplesByClass>(() => emptySoundSamples(initialSoundClasses));
    const [classifier, setClassifier] = useState<ClassifierApp | null>(null);
    const [predictions, setPredictions] = useState<SoundPrediction[]>([]);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('ready');
    const [notice, setNotice] = useState('');
    const canTrain = useMemo(() => canTrainSoundClassifier(classes, samples), [classes, samples]);
    const canSave = trainingStatus === 'done' && !!classifier?.model?.isTrained();
    const isModelReady = !!classifier?.model?.isTrained();

    function resetTraining() {
        clearActiveSoundClassifier();
        setTrainingStatus('ready');
        setClassifier(null);
        setPredictions([]);
        setNotice('');
    }

    function updateClass(id: string, patch: Pick<SoundClass, 'name' | 'icon' | 'tone'>) {
        setClasses((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
        resetTraining();
    }

    function addSamples(id: string, nextSamples: AudioExample[]) {
        const clipId = randomId();
        setSamples((items) => ({
            ...items,
            [id]: [
                ...(items[id] ?? []),
                ...nextSamples.map((data) => ({
                    id: `${clipId}${soundClipIdSeparator}${randomId()}`,
                    clipId,
                    data,
                })),
            ],
        }));
        resetTraining();
    }

    function removeSample(id: string, clipId: string) {
        setSamples((items) => {
            const classSamples = items[id] ?? [];
            return {
                ...items,
                [id]: classSamples.filter((sample) => sample.clipId !== clipId),
            };
        });
        resetTraining();
    }

    function addClass() {
        const index = classes.length;
        setClasses((items) => [
            ...items,
            {
                id: randomId(),
                name: t('train.defaultClass', { number: index + 1 }),
                icon: 'music',
                tone: classTones[index % classTones.length],
            },
        ]);
        resetTraining();
    }

    function removeClass(id: string) {
        setClasses((items) => (items.length > 2 ? items.filter((item) => item.id !== id) : items));
        setSamples((items) => Object.fromEntries(Object.entries(items).filter(([classId]) => classId !== id)));
        resetTraining();
    }

    async function trainClassifier() {
        setTrainingStatus('loading');
        setNotice(t('train.loadingNotice'));
        try {
            const app = await trainSoundClassifier(classes, samples);
            setActiveSoundClassifier(app, classes);
            setClassifier(app);
            setTrainingStatus('done');
            setNotice(t('train.successNotice'));
        } catch {
            setTrainingStatus('ready');
            setNotice(t('train.errorNotice'));
        }
    }

    async function saveModel(selection: SaveModelSelection) {
        if (!classifier?.model?.isTrained()) throw new Error('Expected a trained classifier');

        try {
            const blob = await saveSoundClassifier(classifier, classes, samples, selection);
            setNotice(t('train.savedNotice'));
            return blob;
        } catch (error) {
            setNotice(t('train.saveFailed'));
            throw error;
        }
    }

    async function loadModelFile(file: File) {
        try {
            setNotice(t('train.loadingNotice'));
            const app = await loadSoundClassifier(file);
            const modelLabels = app.getLabels();
            const loadedSamples = samplesFromClassifier(app);
            const storedClasses = soundClassesFromClassifier(app);
            const labels = Array.from(
                { length: Math.max(modelLabels.length, loadedSamples.length, storedClasses.length) },
                (_, index) =>
                    storedClasses[index]?.name ||
                    loadedSamples[index]?.[0]?.data.label ||
                    modelLabels[index] ||
                    t('train.defaultClass', { number: index + 1 }),
            );
            if (labels.length < 2) throw new Error('Not enough sound classes');
            const nextClasses = labels.map((name, index): SoundClass => ({
                id: randomId(),
                name,
                icon: storedClasses[index]?.icon ?? soundIconOptions[index % soundIconOptions.length].value,
                tone: storedClasses[index]?.tone ?? classTones[index % classTones.length],
            }));
            setClasses(nextClasses);
            setSamples(Object.fromEntries(nextClasses.map(({ id }, index) => [id, loadedSamples[index] ?? []])));
            setActiveSoundClassifier(app, nextClasses);
            setClassifier(app);
            setPredictions([]);
            setTrainingStatus('done');
            setNotice(t('train.loadedNotice'));
            return true;
        } catch {
            setNotice(t('train.invalidNotice'));
            return false;
        }
    }

    async function loadModel(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        await loadModelFile(file);
    }

    async function predict(example: AudioExample) {
        if (!classifier?.model?.isTrained()) return;
        try {
            setPredictions(await predictSound(classifier.model, example));
        } catch {
            setPredictions([]);
            setNotice(t('train.errorNotice'));
        }
    }

    return {
        addClass,
        addSamples,
        canSave,
        canTrain,
        classes,
        classifier,
        isModelReady,
        loadModel,
        loadModelFile,
        notice,
        predict,
        predictions,
        removeClass,
        removeSample,
        samples,
        saveModel,
        setNotice,
        trainClassifier,
        trainingStatus,
        updateClass,
    };
}

export type TrainingSession = ReturnType<typeof useTrainingSession>;
