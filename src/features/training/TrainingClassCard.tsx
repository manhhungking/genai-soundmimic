import CheckRounded from '@mui/icons-material/CheckRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import UploadRounded from '@mui/icons-material/UploadRounded';
import type { AudioExample, SoundRecorder } from '@genai-fi/classifier';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getSoundNameKey } from '../../util/soundNames';
import { groupSoundSamplesByClip } from '../../util/soundSamples';
import SoundClassIcon from './SoundClassIcon';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import {
    classTones,
    soundIconOptions,
    type SoundClass,
    type SoundIconKey,
    type SoundSample,
} from './model';
import { createSoundRecorder, extractAudioExamples, recordingOptions } from './soundClassifier';

type TrainingClassCardProps = {
    active: boolean;
    editing: boolean;
    menuOpen: boolean;
    soundClass: SoundClass;
    sampleCount: number;
    samples: SoundSample[];
    canRemove: boolean;
    onAddSamples: (id: string, samples: AudioExample[]) => void;
    onCaptureError: () => void;
    onCloseControls: () => void;
    onEdit: () => void;
    onRemove: (id: string) => void;
    onRemoveSample: (id: string, clipId: string) => void;
    onToggleMenu: () => void;
    onUpdate: (id: string, patch: Pick<SoundClass, 'name' | 'icon' | 'tone'>) => void;
};

export default function TrainingClassCard({
    active,
    editing,
    menuOpen,
    soundClass,
    sampleCount,
    samples,
    canRemove,
    onAddSamples,
    onCaptureError,
    onCloseControls,
    onEdit,
    onRemove,
    onRemoveSample,
    onToggleMenu,
    onUpdate,
}: TrainingClassCardProps) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const recorderRef = useRef<SoundRecorder | null>(null);
    const capturedRef = useRef<AudioExample[]>([]);
    const sampleListRef = useRef<HTMLDivElement>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [recording, setRecording] = useState(false);
    const [micPanelOpen, setMicPanelOpen] = useState(false);
    const [recordingElapsed, setRecordingElapsed] = useState(0);
    const [liveSamples, setLiveSamples] = useState<AudioExample[]>([]);
    const [uploading, setUploading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState(soundClass.name);
    const [draftIcon, setDraftIcon] = useState<SoundIconKey>(soundClass.icon);
    const [draftTone, setDraftTone] = useState<SoundClass['tone']>(soundClass.tone);
    const recordingStartedAtRef = useRef<number | null>(null);
    const defaultNameKey = getSoundNameKey(soundClass.name);
    const displayName = defaultNameKey ? t(defaultNameKey) : soundClass.name;
    const clips = useMemo(() => groupSoundSamplesByClip(samples), [samples]);
    const liveClipSamples = useMemo<SoundSample[]>(() => liveSamples.map((data, index) => ({
        id: `live-${index}`,
        clipId: 'live-recording',
        data,
    })), [liveSamples]);
    const selectedClip = useMemo(
        () => clips.find((clip) => clip.id === selectedClipId) ?? null,
        [clips, selectedClipId],
    );

    useEffect(() => {
        if (!recording) return;
        const timer = window.setInterval(() => {
            if (recordingStartedAtRef.current !== null) {
                setRecordingElapsed(performance.now() - recordingStartedAtRef.current);
            }
        }, 100);
        return () => window.clearInterval(timer);
    }, [recording]);

    useEffect(() => {
        if (!recording) return;
        const sampleList = sampleListRef.current;
        if (sampleList) sampleList.scrollTop = sampleList.scrollHeight;
    }, [liveSamples.length, recording]);

    useEffect(() => () => {
        recorderRef.current?.stopRecording();
        recorderRef.current?.removeAllListeners();
        try {
            playbackSourceRef.current?.stop();
        } catch {
            // The source may already have stopped naturally.
        }
        playbackSourceRef.current = null;
        const playbackContext = playbackContextRef.current;
        playbackContextRef.current = null;
        if (playbackContext?.state !== 'closed') void playbackContext?.close().catch(() => undefined);
    }, []);

    function startEditing() {
        setDraftName(displayName);
        setDraftIcon(soundClass.icon);
        setDraftTone(soundClass.tone);
        onEdit();
    }

    function saveEdit() {
        onUpdate(soundClass.id, {
            name: draftName.trim() || t('train.soundClass'),
            icon: draftIcon,
            tone: draftTone,
        });
        onCloseControls();
    }

    function openRecordingPanel() {
        onCloseControls();
        setMicPanelOpen(true);
        setRecordingElapsed(0);
        setLiveSamples([]);
    }

    const closeRecordingPanel = useCallback(() => {
        recorderRef.current?.stopRecording();
        recorderRef.current?.removeAllListeners();
        recorderRef.current = null;
        capturedRef.current = [];
        recordingStartedAtRef.current = null;
        setRecording(false);
        setRecordingElapsed(0);
        setLiveSamples([]);
        setMicPanelOpen(false);
    }, []);

    useEffect(() => {
        if (!micPanelOpen || recording) return;

        const closeWhenClickingOutsideTrainingData = (event: PointerEvent) => {
            const target = event.target;
            if (target instanceof Element && target.closest('.training-data-panel')) return;
            closeRecordingPanel();
        };

        document.addEventListener('pointerdown', closeWhenClickingOutsideTrainingData);
        return () => document.removeEventListener('pointerdown', closeWhenClickingOutsideTrainingData);
    }, [closeRecordingPanel, micPanelOpen, recording]);

    async function toggleRecording() {
        if (recording) {
            recorderRef.current?.stopRecording();
            return;
        }

        setRecording(true);
        setLiveSamples([]);
        try {
            const recorder = await createSoundRecorder();
            recorderRef.current = recorder;
            capturedRef.current = [];
            recorder.on('example', (example) => {
                capturedRef.current.push(example);
                setLiveSamples([...capturedRef.current]);
            });
            recorder.on('stop', () => {
                const completedSamples = capturedRef.current;
                if (completedSamples.length) onAddSamples(soundClass.id, completedSamples);
                capturedRef.current = [];
                recorderRef.current = null;
                recordingStartedAtRef.current = null;
                setRecording(false);
                setRecordingElapsed(0);
                setLiveSamples([]);
            });
            recorder.on('error', () => {
                capturedRef.current = [];
                recordingStartedAtRef.current = null;
                setRecording(false);
                setLiveSamples([]);
                onCaptureError();
            });
            recordingStartedAtRef.current = performance.now();
            await recorder.startRecording(
                displayName,
                recordingOptions(),
            );
        } catch {
            recorderRef.current = null;
            capturedRef.current = [];
            recordingStartedAtRef.current = null;
            setRecording(false);
            setLiveSamples([]);
            onCaptureError();
        }
    }

    async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (!files.length) return;

        setUploading(true);
        try {
            for (const file of files) {
                const fileSamples = await extractAudioExamples(file, displayName);
                if (fileSamples.length) onAddSamples(soundClass.id, fileSamples);
            }
        } catch {
            onCaptureError();
        } finally {
            setUploading(false);
        }
    }

    function stopSelectedClipPlayback() {
        const source = playbackSourceRef.current;
        const context = playbackContextRef.current;
        playbackSourceRef.current = null;
        playbackContextRef.current = null;

        try {
            source?.stop();
        } catch {
            // The source may already have stopped naturally.
        }
        if (context?.state !== 'closed') void context?.close().catch(() => undefined);
        setPlaying(false);
    }

    async function toggleSelectedClipPlayback() {
        if (playing) {
            stopSelectedClipPlayback();
            return;
        }
        if (!selectedClip) return;
        const rawFrames = selectedClip.samples.flatMap(({ data }) => data.rawAudio ? [data.rawAudio] : []);
        if (!rawFrames.length) return;

        setPlaying(true);
        let context: AudioContext | null = null;
        let source: AudioBufferSourceNode | null = null;
        try {
            context = new AudioContext();
            const sampleRate = rawFrames[0].sampleRateHz;
            const frameLength = rawFrames.reduce((total, frame) => total + frame.data.length, 0);
            const buffer = context.createBuffer(1, frameLength, sampleRate);
            const channel = buffer.getChannelData(0);
            let offset = 0;
            for (const frame of rawFrames) {
                channel.set(frame.data, offset);
                offset += frame.data.length;
            }
            source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            playbackContextRef.current = context;
            playbackSourceRef.current = source;
            const activeSource = source;
            await new Promise<void>((resolve) => {
                activeSource.addEventListener('ended', () => resolve(), { once: true });
                activeSource.start();
            });
        } catch {
            if (!source || playbackSourceRef.current === source) onCaptureError();
        } finally {
            if (!source || playbackSourceRef.current === source) {
                playbackSourceRef.current = null;
                playbackContextRef.current = null;
                if (context?.state !== 'closed') await context?.close().catch(() => undefined);
                setPlaying(false);
            }
        }
    }

    const formatRecordingTime = (milliseconds: number) => {
        const totalSeconds = Math.max(0, milliseconds) / 1000;
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toFixed(1).padStart(4, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <WorkflowNode
            active={active}
            className={`training-class-card training-class-card--${editing ? draftTone : soundClass.tone}`}
            nodeId={`class-${soundClass.id}`}
        >
            <header className="training-class-card__header">
                <span className="training-class-card__icon">
                    <SoundClassIcon icon={soundClass.icon} />
                </span>
                <div>
                    <h3>{displayName}</h3>
                    <small>{t('train.sampleCount', { count: sampleCount })}</small>
                </div>
                <button
                    className="icon-button"
                    type="button"
                    onClick={startEditing}
                    aria-label={t('train.editClass', { name: displayName })}
                >
                    <EditRounded />
                </button>
                <div className="class-menu">
                    <button
                        className="icon-button"
                        type="button"
                        onClick={onToggleMenu}
                        aria-label={t('train.moreOptions', { name: displayName })}
                        aria-expanded={menuOpen}
                    >
                        <MoreVertRounded />
                    </button>
                    {menuOpen && (
                        <button
                            className="class-menu__remove"
                            type="button"
                            disabled={!canRemove}
                            onClick={() => onRemove(soundClass.id)}
                        >
                            <DeleteOutlineRounded /> {t('train.removeClass')}
                        </button>
                    )}
                </div>
            </header>

            {editing && (
                <div
                    className="class-editor"
                    role="group"
                    aria-label={t('train.editClass', { name: displayName })}
                >
                    <label>
                        {t('train.className')}
                        <input
                            value={draftName}
                            onChange={(event) => setDraftName(event.target.value)}
                            maxLength={28}
                            autoFocus
                        />
                    </label>
                    <div className="class-editor__choices">
                        <span>{t('train.chooseIcon')}</span>
                        <div className="class-editor__icons">
                            {soundIconOptions.map((option) => {
                                const iconLabel = t(option.labelKey);
                                return (
                                    <button
                                        className={draftIcon === option.value ? 'is-selected' : ''}
                                        key={option.value}
                                        type="button"
                                        onClick={() => setDraftIcon(option.value)}
                                        aria-label={t('train.useIcon', { name: iconLabel })}
                                        aria-pressed={draftIcon === option.value}
                                        title={iconLabel}
                                    >
                                        <SoundClassIcon icon={option.value} />
                                    </button>
                                );
                            })}
                        </div>
                        <span>{t('train.chooseColor')}</span>
                        <div className="class-editor__colors">
                            {classTones.map((tone) => {
                                const colorLabel = t(`train.color.${tone}`);
                                return (
                                    <button
                                        className={`class-editor__color class-editor__color--${tone}${draftTone === tone ? ' is-selected' : ''}`}
                                        key={tone}
                                        type="button"
                                        onClick={() => setDraftTone(tone)}
                                        aria-label={t('train.useColor', { name: colorLabel })}
                                        aria-pressed={draftTone === tone}
                                        title={colorLabel}
                                    >
                                        {draftTone === tone && <CheckRounded />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button
                        className="class-editor__done"
                        type="button"
                        onClick={saveEdit}
                    >
                        <CheckRounded /> {t('train.done')}
                    </button>
                </div>
            )}

            {micPanelOpen ? (
                <div className="training-recording-panel">
                    <div className="training-recording-panel__live">
                        <div className="training-recording-panel__title">
                            <strong>{t('train.mic')}</strong>
                            <button
                                className="icon-button"
                                type="button"
                                onClick={closeRecordingPanel}
                                aria-label="Close microphone panel"
                            >
                                ×
                            </button>
                        </div>
                        <button className="training-recording-panel__device" type="button">
                            <span>{t('train.microphoneDefault')}</span>
                            <span aria-hidden="true">⌄</span>
                        </button>
                        <div className="training-recording-panel__canvas">
                            <TrainingWaveform active={recording} />
                        </div>
                        <div className="training-recording-panel__timer">
                            <strong>{formatRecordingTime(recordingElapsed)}</strong>
                            <span><b>Min</b><b>Sec</b></span>
                        </div>
                        <button
                            className="training-recording-panel__record"
                            type="button"
                            onClick={toggleRecording}
                            disabled={uploading}
                        >
                            {recording ? <StopRounded /> : <MicRounded />}
                            {recording ? t('train.stop') : t('train.record')}
                        </button>
                    </div>
                    <div className="training-recording-panel__samples">
                        <p>{t('train.moreSamplesNeeded')}</p>
                        <div className="training-recording-panel__sample-list" ref={sampleListRef}>
                            {clips.map((clip, index) => (
                                <button
                                    className={`training-clip-button${selectedClipId === clip.id ? ' is-selected' : ''}`}
                                    key={clip.id}
                                    type="button"
                                    onClick={() => setSelectedClipId(clip.id)}
                                    disabled={playing}
                                    aria-label={`${t('media.recordedSamples')} ${index + 1}`}
                                    aria-pressed={selectedClipId === clip.id}
                                >
                                    <TrainingWaveform samples={clip.samples} />
                                </button>
                            ))}
                            {recording && (
                                <div
                                    className="training-recording-panel__live-sample"
                                    aria-live="polite"
                                >
                                    <TrainingWaveform active fullWidth samples={liveClipSamples} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="training-class-card__actions">
                <button
                    type="button"
                    onClick={openRecordingPanel}
                    disabled={uploading}
                    aria-label={t('train.recordClass', { name: displayName })}
                >
                    <MicRounded /> {t('train.mic')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onCloseControls();
                        fileRef.current?.click();
                    }}
                    disabled={recording || uploading}
                >
                    <UploadRounded /> {t('train.upload')}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleUpload}
                    aria-label={t('train.uploadSamples', { name: displayName })}
                />
                </div>
            )}

            {!micPanelOpen && sampleCount > 0 && (
                <div className="training-class-card__samples">
                    {clips.length ? (
                        <div className="training-class-card__sample-strip">
                            {clips.map((clip, index) => (
                                <button
                                    className={`training-clip-button${selectedClipId === clip.id ? ' is-selected' : ''}`}
                                    key={clip.id}
                                    type="button"
                                    onClick={() => setSelectedClipId(clip.id)}
                                    disabled={playing}
                                    aria-label={`${t('media.recordedSamples')} ${index + 1}`}
                                    aria-pressed={selectedClipId === clip.id}
                                >
                                    <TrainingWaveform samples={clip.samples} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <TrainingWaveform active={recording || playing} />
                    )}
                    <button
                        className="round-action"
                        type="button"
                        disabled={!selectedClip?.samples.some(({ data }) => !!data.rawAudio)}
                        onClick={toggleSelectedClipPlayback}
                        aria-label={playing ? `${t('train.stop')} ${displayName}` : t('train.playSamples', { name: displayName })}
                    >
                        {playing ? <StopRounded /> : <PlayArrowRounded />}
                    </button>
                    <button
                        className="icon-button"
                        type="button"
                        disabled={!selectedClip || playing}
                        onClick={() => {
                            if (!selectedClipId) return;
                            onRemoveSample(soundClass.id, selectedClipId);
                            setSelectedClipId(null);
                        }}
                        aria-label={t('train.removeSample', { name: displayName })}
                    >
                        <DeleteOutlineRounded />
                    </button>
                </div>
            )}
        </WorkflowNode>
    );
}
