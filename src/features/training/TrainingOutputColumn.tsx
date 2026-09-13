import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import type { AudioExample, SoundRecorder } from '@genai-fi/classifier';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getSoundNameKey } from '../../locales/sounds';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import type { SoundClass } from './model';
import { createSoundRecorder, extractAudioExamples, recordingOptions, type SoundPrediction } from './soundClassifier';

type TrainingOutputColumnProps = {
    classes: SoundClass[];
    canPredict: boolean;
    predictions: SoundPrediction[];
    onPredict: (example: AudioExample) => Promise<void>;
};

function InputPanel({ canPredict, onPredict }: Pick<TrainingOutputColumnProps, 'canPredict' | 'onPredict'>) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const recorderRef = useRef<SoundRecorder | null>(null);
    const inputRequestedRef = useRef(false);
    const [enabled, setEnabled] = useState(false);
    const [tab, setTab] = useState<'mic' | 'file'>('mic');
    const [fileName, setFileName] = useState('');

    useEffect(() => () => {
        recorderRef.current?.stopRecording();
        recorderRef.current?.removeAllListeners();
    }, []);

    async function startMicrophonePreview() {
        try {
            const recorder = await createSoundRecorder();
            if (!inputRequestedRef.current) return;
            recorderRef.current = recorder;
            recorder.on('example', (example) => void onPredict(example));
            recorder.on('stop', () => {
                inputRequestedRef.current = false;
                recorderRef.current = null;
                setEnabled(false);
            });
            recorder.on('error', () => {
                inputRequestedRef.current = false;
                setEnabled(false);
            });
            await recorder.startRecording('preview', recordingOptions(60 * 60 * 1000, false));
            if (!inputRequestedRef.current) recorder.stopRecording();
        } catch {
            recorderRef.current = null;
            setEnabled(false);
        }
    }

    function setInputEnabled(next: boolean) {
        inputRequestedRef.current = next;
        setEnabled(next);
        if (!next) recorderRef.current?.stopRecording();
        else if (tab === 'mic') void startMicrophonePreview();
    }

    function selectTab(next: 'mic' | 'file') {
        inputRequestedRef.current = false;
        recorderRef.current?.stopRecording();
        setEnabled(false);
        setTab(next);
    }

    async function handleFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        setFileName(file?.name ?? '');
        if (!file || !canPredict) return;
        try {
            const examples = await extractAudioExamples(file, 'preview', false);
            const example = examples.at(-1);
            if (example) await onPredict(example);
        } catch {
            setFileName('');
        }
    }

    return (
        <WorkflowNode
            className="sound-input-panel train-surface"
            nodeId="input"
            active={enabled}
        >
            <header>
                <h2>{t('train.input')}</h2>
                <label className="input-switch">
                    <span>{t(enabled ? 'train.on' : 'train.off')}</span>
                    <input
                        type="checkbox"
                        checked={enabled}
                        disabled={!canPredict}
                        onChange={(event) => setInputEnabled(event.target.checked)}
                        aria-label={t('train.enableInput')}
                    />
                    <i />
                </label>
            </header>
            <div className="input-tabs" role="tablist" aria-label={t('train.inputSource')}>
                <button
                    className={tab === 'mic' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'mic'}
                    onClick={() => selectTab('mic')}
                >
                    {t('train.mic')}
                </button>
                <button
                    className={tab === 'file' ? 'is-active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={tab === 'file'}
                    onClick={() => selectTab('file')}
                >
                    {t('train.file')}
                </button>
            </div>
            {tab === 'mic' ? (
                <>
                    <button className="microphone-select" type="button">
                        <MicRounded /> {t('train.microphoneDefault')} <span>⌄</span>
                    </button>
                    <TrainingWaveform active={enabled} />
                </>
            ) : (
                <div className="input-file-state">
                    <UploadFileRounded />
                    <p>{fileName || t('train.chooseFileHint')}</p>
                    <button type="button" onClick={() => fileRef.current?.click()}>
                        {t('train.chooseFile')}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFile}
                        aria-label={t('train.chooseInputFile')}
                    />
                </div>
            )}
        </WorkflowNode>
    );
}
function ClassifierPreview({ classes, predictions }: Pick<TrainingOutputColumnProps, 'classes' | 'predictions'>) {
    const { t } = useTranslation();

    return (
        <WorkflowNode className="classifier-preview train-surface" nodeId="classifier">
            <header>
                <div>
                    <h2>{t('train.preview')}</h2>
                    <p>{t('train.previewDescription')}</p>
                </div>
                <AutoAwesomeRounded />
            </header>
            <ul>
                {classes.map((soundClass) => {
                    const score = Math.round(
                        (predictions.find(({ className }) => className === soundClass.name)?.probability ?? 0) * 100,
                    );
                    const defaultNameKey = getSoundNameKey(soundClass.name);
                    return (
                        <li key={soundClass.id}>
                            <strong>{defaultNameKey ? t(defaultNameKey) : soundClass.name}</strong>
                            <div className={`classifier-preview__bar classifier-preview__bar--${soundClass.tone}`}>
                                <span style={{ width: `${score}%` }} />
                            </div>
                            <b>{score}%</b>
                        </li>
                    );
                })}
            </ul>
        </WorkflowNode>
    );
}

function XaiActions() {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');

    return (
        <WorkflowNode className="training-xai-actions" nodeId="xai-actions">
            <div className="training-xai-actions__intro">
                <span><LightbulbRounded /></span>
                <div>
                    <h2>{t('train.xaiTitle')}</h2>
                    <p>{t('train.xaiDescription')}</p>
                </div>
            </div>
            <div className="training-xai-actions__buttons">
                <button type="button" onClick={() => setMessage(t('train.statisticsNotice'))}>
                    <BarChartRounded /> {t('train.statistics')}
                </button>
                <Link to="/xai">
                    <AutoAwesomeRounded /> {t('train.explain')}
                </Link>
            </div>
            {message && <p className="training-xai-actions__message" role="status">{message}</p>}
        </WorkflowNode>
    );
}

export default function TrainingOutputColumn({
    classes,
    canPredict,
    predictions,
    onPredict,
}: TrainingOutputColumnProps) {
    return (
        <div className="training-output-column">
            <InputPanel canPredict={canPredict} onPredict={onPredict} />
            <ClassifierPreview classes={classes} predictions={predictions} />
            <XaiActions />
        </div>
    );
}
