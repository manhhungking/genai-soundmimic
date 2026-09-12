import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import { WorkflowLayout, type IConnection } from '@genai-fi/base';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import TrainingDataPanel from '../features/training/TrainingDataPanel';
import TrainingOutputColumn from '../features/training/TrainingOutputColumn';
import TrainingStage, { type TrainingStatus } from '../features/training/TrainingStage';
import {
    classTones,
    initialSoundClasses,
    soundIconOptions,
    type SoundClass,
    type SoundIconKey,
} from '../features/training/model';
import { loadClassifier, randomId } from '../shared/genai';

const connections: IConnection[] = [
    { start: 'class', end: 'trainer', startPoint: 'right', endPoint: 'left' },
    { start: 'trainer', end: 'input', startPoint: 'right', endPoint: 'left' },
    { start: 'input', end: 'classifier', startPoint: 'bottom', endPoint: 'top' },
    { start: 'classifier', end: 'xai-actions', startPoint: 'bottom', endPoint: 'top' },
];

const iconKeys = new Set<SoundIconKey>(soundIconOptions.map(({ value }) => value));

function isSoundClassList(value: unknown): value is SoundClass[] {
    if (!Array.isArray(value) || value.length < 2) return false;
    return value.every(
        (item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.sampleCount === 'number' &&
            typeof item.icon === 'string' &&
            iconKeys.has(item.icon as SoundIconKey) &&
            typeof item.tone === 'string' &&
            classTones.includes(item.tone as SoundClass['tone'])
    );
}
export function Component() {
    const loadRef = useRef<HTMLInputElement>(null);
    const [classes, setClasses] = useState<SoundClass[]>(initialSoundClasses);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('ready');
    const [notice, setNotice] = useState('');
    const sampleCount = useMemo(() => classes.reduce((total, item) => total + item.sampleCount, 0), [classes]);

    function resetTraining() {
        setTrainingStatus('ready');
        setNotice('');
    }

    function updateClass(id: string, patch: Pick<SoundClass, 'name' | 'icon'>) {
        setClasses((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
        resetTraining();
    }

    function addSamples(id: string, count: number) {
        setClasses((items) =>
            items.map((item) => (item.id === id ? { ...item, sampleCount: item.sampleCount + count } : item))
        );
        resetTraining();
    }

    function removeSample(id: string) {
        setClasses((items) =>
            items.map((item) =>
                item.id === id ? { ...item, sampleCount: Math.max(0, item.sampleCount - 1) } : item
            )
        );
        resetTraining();
    }

    function addClass() {
        const index = classes.length;
        setClasses((items) => [
            ...items,
            {
                id: randomId(),
                name: `Class ${index + 1}`,
                icon: 'music',
                sampleCount: 0,
                tone: classTones[index % classTones.length],
            },
        ]);
        resetTraining();
    }

    function removeClass(id: string) {
        setClasses((items) => (items.length > 2 ? items.filter((item) => item.id !== id) : items));
        resetTraining();
    }

    async function trainClassifier() {
        setTrainingStatus('loading');
        setNotice('Loading the sound classifier…');
        try {
            await loadClassifier();
            await new Promise((resolve) => window.setTimeout(resolve, 850));
            setTrainingStatus('done');
            setNotice('Great work! Your classroom model is ready to try.');
        } catch {
            setTrainingStatus('ready');
            setNotice('The classifier could not start. Please try again.');
        }
    }

    function saveModel() {
        const blob = new Blob([JSON.stringify({ version: 1, classes }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sound-mimic-classes.json';
        link.click();
        URL.revokeObjectURL(url);
        setNotice('Class names, icons, and sample counts were saved.');
    }

    async function loadModel(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const parsed: unknown = JSON.parse(await file.text());
            const nextClasses =
                typeof parsed === 'object' && parsed !== null && 'classes' in parsed ? parsed.classes : undefined;
            if (!isSoundClassList(nextClasses)) throw new Error('Invalid class data');
            setClasses(nextClasses);
            setTrainingStatus('ready');
            setNotice('Model classes loaded. Review them, then train again.');
        } catch {
            setNotice('That file is not a Sound Mimic model.');
        }
    }

    return (
        <div className="train-page">
            <header className="train-toolbar">
                <div>
                    <h1>Train Model</h1>
                    <p>Record or upload sounds to build your classifier.</p>
                </div>
                <div className="train-toolbar__actions">
                    <button type="button" onClick={() => loadRef.current?.click()}>
                        <FolderOpenRounded /> Load Model
                    </button>
                    <button className="is-primary" type="button" onClick={saveModel}>
                        <SaveRounded /> Save Model
                    </button>
                    <input ref={loadRef} type="file" accept="application/json,.json" onChange={loadModel} aria-label="Load a Sound Mimic model" />
                </div>
            </header>

            <div className="train-workflow">
                <WorkflowLayout connections={connections} columns={3}>
                    <TrainingDataPanel
                        classes={classes}
                        onAddClass={addClass}
                        onAddSamples={addSamples}
                        onRemoveClass={removeClass}
                        onRemoveSample={removeSample}
                        onUpdateClass={updateClass}
                    />
                    <TrainingStage
                        classCount={classes.length}
                        sampleCount={sampleCount}
                        status={trainingStatus}
                        onTrain={trainClassifier}
                    />
                    <TrainingOutputColumn classes={classes} />
                </WorkflowLayout>
            </div>
            {notice && <p className="train-notice" role="status">{notice}</p>}
        </div>
    );
}
