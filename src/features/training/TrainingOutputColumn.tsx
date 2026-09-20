import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MenuRounded from '@mui/icons-material/MenuRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import type { AudioExample, SoundRecorder } from '@genai-fi/classifier';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getSoundNameKey } from '../../util/soundNames';
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

const recorderStopTimeoutMillis = 1_000;

async function stopSoundRecorder(recorder: SoundRecorder) {
    await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            recorder.removeListener('stop', finish);
            resolve();
        };
        const timeout = window.setTimeout(finish, recorderStopTimeoutMillis);

        recorder.once('stop', finish);
        recorder.stopRecording();
    });
    recorder.removeAllListeners();
}

function InputPanel({ canPredict, onPredict }: Pick<TrainingOutputColumnProps, 'canPredict' | 'onPredict'>) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const microphoneMenuRef = useRef<HTMLDivElement>(null);
    const microphoneTriggerRef = useRef<HTMLButtonElement>(null);
    const recorderRef = useRef<SoundRecorder | null>(null);
    const inputRequestedRef = useRef(false);
    const previewSessionRef = useRef(0);
    const [enabled, setEnabled] = useState(false);
    const [tab, setTab] = useState<'mic' | 'file'>('mic');
    const [fileName, setFileName] = useState('');
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [microphoneMenuOpen, setMicrophoneMenuOpen] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const microphoneOptions = [
        { deviceId: '', label: t('train.microphoneDefault') },
        ...microphones
            .filter(({ deviceId }) => deviceId && deviceId !== 'default')
            .map((device, index) => ({
                deviceId: device.deviceId,
                label: device.label || `${t('train.mic')} ${index + 1}`,
            })),
    ];
    const selectedMicrophone = microphoneOptions.find(({ deviceId }) => deviceId === selectedDeviceId)
        ?? microphoneOptions[0];

    useEffect(() => () => {
        inputRequestedRef.current = false;
        previewSessionRef.current += 1;
        const recorder = recorderRef.current;
        recorderRef.current = null;
        if (recorder) void stopSoundRecorder(recorder);
    }, []);

    useEffect(() => {
        if (!microphoneMenuOpen) return;

        function closeOnOutsidePress(event: PointerEvent) {
            if (!microphoneMenuRef.current?.contains(event.target as Node)) setMicrophoneMenuOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setMicrophoneMenuOpen(false);
            microphoneTriggerRef.current?.focus();
        }

        document.addEventListener('pointerdown', closeOnOutsidePress);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [microphoneMenuOpen]);

    async function refreshMicrophones() {
        try {
            const devices = await navigator.mediaDevices?.enumerateDevices();
            setMicrophones(devices?.filter(({ kind }) => kind === 'audioinput') ?? []);
        } catch {
            setMicrophones([]);
        }
    }

    function stopMicrophonePreview() {
        inputRequestedRef.current = false;
        previewSessionRef.current += 1;
        const recorder = recorderRef.current;
        recorderRef.current = null;
        if (recorder) void stopSoundRecorder(recorder);
        setEnabled(false);
    }

    async function startMicrophonePreview(deviceId = selectedDeviceId) {
        const previewSession = previewSessionRef.current + 1;
        previewSessionRef.current = previewSession;
        const previousRecorder = recorderRef.current;
        recorderRef.current = null;

        try {
            if (previousRecorder) await stopSoundRecorder(previousRecorder);
            if (!inputRequestedRef.current || previewSessionRef.current !== previewSession) return;

            const recorder = await createSoundRecorder();
            if (!inputRequestedRef.current || previewSessionRef.current !== previewSession) {
                void stopSoundRecorder(recorder);
                return;
            }
            recorderRef.current = recorder;
            recorder.on('example', (example) => {
                if (previewSessionRef.current === previewSession) void onPredict(example);
            });
            recorder.on('stop', () => {
                if (previewSessionRef.current !== previewSession) return;
                inputRequestedRef.current = false;
                recorderRef.current = null;
                setEnabled(false);
            });
            recorder.on('error', () => {
                if (previewSessionRef.current !== previewSession) return;
                inputRequestedRef.current = false;
                recorderRef.current = null;
                setEnabled(false);
            });
            await recorder.startRecording(
                'preview',
                recordingOptions(60 * 60 * 1000, false, deviceId || undefined),
            );
            if (!inputRequestedRef.current || previewSessionRef.current !== previewSession) {
                void stopSoundRecorder(recorder);
                return;
            }
            void refreshMicrophones();
        } catch {
            if (previewSessionRef.current === previewSession) {
                recorderRef.current?.removeAllListeners();
                recorderRef.current = null;
                inputRequestedRef.current = false;
                setEnabled(false);
            }
        }
    }

    function setInputEnabled(next: boolean) {
        if (!next) {
            stopMicrophonePreview();
            return;
        }
        inputRequestedRef.current = true;
        setEnabled(true);
        if (tab === 'mic') void startMicrophonePreview();
    }

    function selectTab(next: 'mic' | 'file') {
        stopMicrophonePreview();
        setMicrophoneMenuOpen(false);
        setTab(next);
    }

    function selectMicrophone(deviceId: string) {
        setSelectedDeviceId(deviceId);
        setMicrophoneMenuOpen(false);
        microphoneTriggerRef.current?.focus();
        if (!enabled) return;
        inputRequestedRef.current = true;
        void startMicrophonePreview(deviceId);
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
            className={`sound-input-panel train-surface${microphoneMenuOpen ? ' is-source-menu-open' : ''}`}
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
                    <div className={`microphone-source${microphoneMenuOpen ? ' is-open' : ''}`} ref={microphoneMenuRef}>
                        <button
                            aria-expanded={microphoneMenuOpen}
                            aria-haspopup="listbox"
                            aria-label={`${t('train.inputSource')}: ${selectedMicrophone.label}`}
                            className="microphone-select"
                            onClick={() => {
                                const nextOpen = !microphoneMenuOpen;
                                setMicrophoneMenuOpen(nextOpen);
                                if (nextOpen) void refreshMicrophones();
                            }}
                            ref={microphoneTriggerRef}
                            type="button"
                        >
                            <MicRounded aria-hidden="true" />
                            <span>{selectedMicrophone.label}</span>
                            <ExpandMoreRounded aria-hidden="true" />
                        </button>
                        {microphoneMenuOpen && (
                            <ul
                                aria-label={t('train.inputSource')}
                                className="microphone-source__menu"
                                role="listbox"
                            >
                                {microphoneOptions.map(({ deviceId, label }) => (
                                    <li key={deviceId || 'default'} role="presentation">
                                        <button
                                            aria-selected={deviceId === selectedDeviceId}
                                            onClick={() => selectMicrophone(deviceId)}
                                            role="option"
                                            type="button"
                                        >
                                            <span>{label}</span>
                                            {deviceId === selectedDeviceId && <CheckRounded aria-hidden="true" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
function ClassifierPreview({
    classes,
    canPredict,
    predictions,
}: Pick<TrainingOutputColumnProps, 'classes' | 'canPredict' | 'predictions'>) {
    const { t } = useTranslation();

    if (!canPredict) {
        return (
            <WorkflowNode
                active={false}
                className="classifier-preview classifier-preview--empty train-surface"
                nodeId="classifier"
            >
                <header>
                    <h2>{t('train.classifier')}</h2>
                    <MenuRounded aria-hidden="true" />
                </header>
                <p className="classifier-preview__empty-message">
                    <InfoOutlined aria-hidden="true" />
                    <span>{t('train.mustTrainFirst')}</span>
                </p>
            </WorkflowNode>
        );
    }

    return (
        <WorkflowNode active={canPredict} className="classifier-preview train-surface" nodeId="classifier">
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
            <ClassifierPreview classes={classes} canPredict={canPredict} predictions={predictions} />
            <XaiActions />
        </div>
    );
}
