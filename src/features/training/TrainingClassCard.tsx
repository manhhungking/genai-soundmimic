import CheckRounded from '@mui/icons-material/CheckRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import UploadRounded from '@mui/icons-material/UploadRounded';
import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getSoundNameKey } from '../../locales/sounds';
import SoundClassIcon from './SoundClassIcon';
import TrainingWaveform from './TrainingWaveform';
import WorkflowNode from './WorkflowNode';
import { soundIconOptions, type SoundClass, type SoundIconKey } from './model';

type TrainingClassCardProps = {
    soundClass: SoundClass;
    canRemove: boolean;
    onAddSamples: (id: string, count: number) => void;
    onRemove: (id: string) => void;
    onRemoveSample: (id: string) => void;
    onUpdate: (id: string, patch: Pick<SoundClass, 'name' | 'icon'>) => void;
};

export default function TrainingClassCard({
    soundClass,
    canRemove,
    onAddSamples,
    onRemove,
    onRemoveSample,
    onUpdate,
}: TrainingClassCardProps) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [draftName, setDraftName] = useState(soundClass.name);
    const [draftIcon, setDraftIcon] = useState<SoundIconKey>(soundClass.icon);
    const defaultNameKey = getSoundNameKey(soundClass.name);
    const displayName = defaultNameKey ? t(defaultNameKey) : soundClass.name;

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

    function toggleRecording() {
        if (recording) onAddSamples(soundClass.id, 1);
        setRecording((value) => !value);
    }

    function handleUpload(event: ChangeEvent<HTMLInputElement>) {
        const count = event.target.files?.length ?? 0;
        if (count) onAddSamples(soundClass.id, count);
        event.target.value = '';
    }

    return (
        <WorkflowNode
            className={`training-class-card training-class-card--${soundClass.tone}`}
            nodeId="class"
        >
            <header className="training-class-card__header">
                <span className="training-class-card__icon">
                    <SoundClassIcon icon={soundClass.icon} />
                </span>
                <div>
                    <h3>{displayName}</h3>
                    <small>{t('train.sampleCount', { count: soundClass.sampleCount })}</small>
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

            <div className="training-class-card__samples">
                <TrainingWaveform active={recording || playing} />
                <button
                    className="round-action"
                    type="button"
                    onClick={() => setPlaying((value) => !value)}
                    aria-label={t(playing ? 'train.pauseSamples' : 'train.playSamples', { name: displayName })}
                >
                    {playing ? <span className="pause-icon">Ⅱ</span> : <PlayArrowRounded />}
                </button>
                <button
                    className="icon-button"
                    type="button"
                    disabled={soundClass.sampleCount === 0}
                    onClick={() => onRemoveSample(soundClass.id)}
                    aria-label={t('train.removeSample', { name: displayName })}
                >
                    <DeleteOutlineRounded />
                </button>
            </div>
        </WorkflowNode>
    );
}
