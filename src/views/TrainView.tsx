import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import { WorkflowLayout, type IConnection } from '@genai-fi/base';
import type ClassifierApp from '@genai-fi/classifier';
import type { AudioExample } from '@genai-fi/classifier';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import TrainingDataPanel from '../features/training/TrainingDataPanel';
import TrainingOutputColumn from '../features/training/TrainingOutputColumn';
import TrainingStage, { type TrainingStatus } from '../features/training/TrainingStage';
import {
    classTones,
    emptySoundSamples,
    initialSoundClasses,
    soundIconOptions,
    type SoundClass,
    type SoundSamplesByClass,
} from '../features/training/model';
import {
    canTrainSoundClassifier,
    loadSoundClassifier,
    predictSound,
    samplesFromClassifier,
    saveSoundClassifier,
    soundClassesFromClassifier,
    trainSoundClassifier,
    type SoundPrediction,
} from '../features/training/soundClassifier';
import { randomId } from '../shared/genai';

export function Component() {
    const { t } = useTranslation();
    const loadRef = useRef<HTMLInputElement>(null);
    const [classes, setClasses] = useState<SoundClass[]>(initialSoundClasses);
    const [samples, setSamples] = useState<SoundSamplesByClass>(() => emptySoundSamples(initialSoundClasses));
    const [classifier, setClassifier] = useState<ClassifierApp | null>(null);
    const [predictions, setPredictions] = useState<SoundPrediction[]>([]);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('ready');
    const [notice, setNotice] = useState('');
    const sampleCount = useMemo(
        () => classes.reduce((total, item) => total + (samples[item.id]?.length ?? 0), 0),
        [classes, samples],
    );
    const canTrain = useMemo(() => canTrainSoundClassifier(classes, samples), [classes, samples]);
    const connections = useMemo<IConnection[]>(() => [
        ...classes.map(({ id }) => ({
            start: `class-${id}`,
            end: 'trainer',
            startPoint: 'right' as const,
            endPoint: 'left' as const,
        })),
        { start: 'trainer', end: 'input', startPoint: 'right', endPoint: 'left' },
        { start: 'input', end: 'classifier', startPoint: 'bottom', endPoint: 'top' },
        { start: 'classifier', end: 'xai-actions', startPoint: 'bottom', endPoint: 'top' },
    ], [classes]);

    useEffect(() => () => classifier?.model?.dispose(), [classifier]);

    function resetTraining() {
        setTrainingStatus('ready');
        setClassifier(null);
        setPredictions([]);
        setNotice('');
    }

    function updateClass(id: string, patch: Pick<SoundClass, 'name' | 'icon'>) {
        setClasses((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
        resetTraining();
    }

    function addSamples(id: string, nextSamples: AudioExample[]) {
        setSamples((items) => ({
            ...items,
            [id]: [...(items[id] ?? []), ...nextSamples.map((data) => ({ id: randomId(), data }))],
        }));
        resetTraining();
    }

    function removeSample(id: string) {
        setSamples((items) => ({ ...items, [id]: (items[id] ?? []).slice(0, -1) }));
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
            setClassifier(app);
            setTrainingStatus('done');
            setNotice(t('train.successNotice'));
        } catch {
            setTrainingStatus('ready');
            setNotice(t('train.errorNotice'));
        }
    }

    async function saveModel() {
        if (!classifier?.model?.isTrained()) {
            setNotice(t('train.errorNotice'));
            return;
        }
        try {
            const blob = await saveSoundClassifier(classifier, classes, samples);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sound-mimic-model.zip';
            link.click();
            URL.revokeObjectURL(url);
            setNotice(t('train.savedNotice'));
        } catch {
            setNotice(t('train.errorNotice'));
        }
    }

    async function loadModel(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
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
            setClassifier(app);
            setPredictions([]);
            setTrainingStatus('done');
            setNotice(t('train.loadedNotice'));
        } catch {
            setNotice(t('train.invalidNotice'));
        }
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

    return (
        <div className="train-page">
            <header className="train-toolbar">
                <div>
                    <h1>{t('train.title')}</h1>
                    <p>{t('train.description')}</p>
                </div>
                <div className="train-toolbar__actions">
                    <button type="button" onClick={() => loadRef.current?.click()}>
                        <FolderOpenRounded /> {t('train.loadModel')}
                    </button>
                    <button className="is-primary" type="button" onClick={saveModel}>
                        <SaveRounded /> {t('train.saveModel')}
                    </button>
                    <input
                        ref={loadRef}
                        type="file"
                        accept="application/zip,.zip"
                        onChange={loadModel}
                        aria-label={t('train.loadModelAria')}
                    />
                </div>
            </header>

            <div className="train-workflow">
                <WorkflowLayout connections={connections} columns={3}>
                    <TrainingDataPanel
                        classes={classes}
                        samples={samples}
                        onAddClass={addClass}
                        onAddSamples={addSamples}
                        onCaptureError={() => setNotice(t('train.errorNotice'))}
                        onRemoveClass={removeClass}
                        onRemoveSample={removeSample}
                        onUpdateClass={updateClass}
                    />
                    <TrainingStage
                        sampleCount={sampleCount}
                        canTrain={canTrain}
                        status={trainingStatus}
                        onTrain={trainClassifier}
                    />
                    <TrainingOutputColumn
                        classes={classes}
                        canPredict={trainingStatus === 'done' && !!classifier?.model?.isTrained()}
                        predictions={predictions}
                        onPredict={predict}
                    />
                </WorkflowLayout>
            </div>
            {notice && <p className="train-notice" role="status">{notice}</p>}
        </div>
    );
}
