import CheckRounded from '@mui/icons-material/CheckRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import UploadRounded from '@mui/icons-material/UploadRounded';
import type { AudioExample, SoundRecorder } from '@genai-fi/classifier';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getSoundNameKey } from '../../locales/sounds';
import SoundClassIcon from './SoundClassIcon';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import { soundIconOptions, type SoundClass, type SoundIconKey, type SoundSample } from './model';
import { createSoundRecorder, extractAudioExamples, recordingOptions } from './soundClassifier';

type TrainingClassCardProps = {
    soundClass: SoundClass;
    sampleCount: number;
    samples: SoundSample[];
    isBackgroundNoise: boolean;
    canRemove: boolean;
    onAddSamples: (id: string, samples: AudioExample[]) => void;
    onCaptureError: () => void;
    onRemove: (id: string) => void;
    onRemoveSample: (id: string) => void;
    onUpdate: (id: string, patch: Pick<SoundClass, 'name' | 'icon'>) => void;
};

export default function TrainingClassCard({
    soundClass,
    sampleCount,
    samples,
    isBackgroundNoise,
    canRemove,
    onAddSamples,
    onCaptureError,
    onRemove,
    onRemoveSample,
    onUpdate,
}: TrainingClassCardProps) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const recorderRef = useRef<SoundRecorder | null>(null);
    const capturedRef = useRef<AudioExample[]>([]);
    const [editing, setEditing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [draftName, setDraftName] = useState(soundClass.name);
    const [draftIcon, setDraftIcon] = useState<SoundIconKey>(soundClass.icon);
    const defaultNameKey = getSoundNameKey(soundClass.name);
    const displayName = defaultNameKey ? t(defaultNameKey) : soundClass.name;
    const latestSample = samples.at(-1)?.data;
    const spectrograms = useMemo(
        () => samples.flatMap(({ id, data }) => {
            if (!data.spectrogramCanvas) return [];
            try {
                return [{ id, url: data.spectrogramCanvas.toDataURL('image/png') }];
            } catch {
                return [];
            }
        }),
        [samples],
    );

    useEffect(() => () => {
        recorderRef.current?.stopRecording();
        recorderRef.current?.removeAllListeners();
    }, []);

    function startEditing() {
        setDraftName(displayName);
        setDraftIcon(soundClass.icon);
        setMenuOpen(false);
        setEditing(true);
    }

    function saveEdit() {
        onUpdate(soundClass.id, {
            name: draftName.trim() || t('train.soundClass'),
            icon: draftIcon,
        });
        setEditing(false);
    }

    async function toggleRecording() {
        if (recording) {
            recorderRef.current?.stopRecording();
            return;
        }

        setRecording(true);
        try {
            const recorder = await createSoundRecorder();
            recorderRef.current = recorder;
            capturedRef.current = [];
            recorder.on('example', (example) => capturedRef.current.push(example));
            recorder.on('stop', () => {
                if (capturedRef.current.length) onAddSamples(soundClass.id, capturedRef.current);
                capturedRef.current = [];
                recorderRef.current = null;
                setRecording(false);
            });
            recorder.on('error', onCaptureError);
            await recorder.startRecording(
                displayName,
                recordingOptions(isBackgroundNoise ? 20_000 : 6_000),
            );
        } catch {
            recorderRef.current = null;
            setRecording(false);
            onCaptureError();
        }
    }

    async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (!files.length) return;

        setUploading(true);
        try {
            const samples: AudioExample[] = [];
            for (const file of files) samples.push(...await extractAudioExamples(file, displayName));
            if (samples.length) onAddSamples(soundClass.id, samples);
        } catch {
            onCaptureError();
        } finally {
            setUploading(false);
        }
    }

    async function playSample() {
        if (!latestSample?.rawAudio || playing) return;
        setPlaying(true);
        try {
            const context = new AudioContext({ sampleRate: latestSample.rawAudio.sampleRateHz });
            const buffer = context.createBuffer(1, latestSample.rawAudio.data.length, latestSample.rawAudio.sampleRateHz);
            buffer.copyToChannel(new Float32Array(latestSample.rawAudio.data), 0);
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            await new Promise<void>((resolve) => {
                source.addEventListener('ended', () => resolve(), { once: true });
                source.start();
            });
            await context.close();
        } catch {
            onCaptureError();
        } finally {
            setPlaying(false);
        }
    }

    return (
        <WorkflowNode
            className={`training-class-card training-class-card--${soundClass.tone}`}
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
                        onClick={() => setMenuOpen((value) => !value)}
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
                    <button
                        className="class-editor__done"
                        type="button"
                        onClick={saveEdit}
                    >
                        <CheckRounded /> {t('train.done')}
                    </button>
                </div>
            )}

            <div className="training-class-card__actions">
                <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={uploading}
                    aria-label={
                        recording
                            ? t('play.stopRecording')
                            : t('train.recordClass', { name: displayName })
                    }
                >
                    {recording ? <StopRounded /> : <MicRounded />}
                    {recording ? t('train.stop') : t('train.mic')}
                </button>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
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

            {(sampleCount > 0 || recording) && (
                <div className="training-class-card__samples">
                    {spectrograms.length ? (
                        <div className="training-class-card__sample-strip">
                            {spectrograms.map(({ id, url }) => (
                                <img
                                    alt={t('media.spectrogram')}
                                    className="training-spectrogram"
                                    key={id}
                                    src={url}
                                />
                            ))}
                        </div>
                    ) : (
                        <TrainingWaveform active={recording || playing} />
                    )}
                    <button
                        className="round-action"
                        type="button"
                        disabled={!latestSample?.rawAudio || playing}
                        onClick={playSample}
                        aria-label={t(playing ? 'train.pauseSamples' : 'train.playSamples', { name: displayName })}
                    >
                        {playing ? <span className="pause-icon">Ⅱ</span> : <PlayArrowRounded />}
                    </button>
                    <button
                        className="icon-button"
                        type="button"
                        disabled={sampleCount === 0}
                        onClick={() => onRemoveSample(soundClass.id)}
                        aria-label={t('train.removeSample', { name: displayName })}
                    >
                        <DeleteOutlineRounded />
                    </button>
                </div>
            )}
        </WorkflowNode>
    );
}
