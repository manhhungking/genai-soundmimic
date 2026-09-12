import AddRounded from '@mui/icons-material/AddRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ContentCutRounded from '@mui/icons-material/ContentCutRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SetupSoundIcon from './SetupSoundIcon';
import SetupStepHeader from './SetupStepHeader';
import SetupWaveform from './SetupWaveform';
import type { SetupRound } from './model';

type RoundBuilderProps = {
    onAdd: () => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    onToggleChallenge: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
    rounds: SetupRound[];
    selectedRoundId: string;
};

function getRoundName(round: SetupRound, t: ReturnType<typeof useTranslation>['t']) {
    const defaultNames: Record<SetupRound['icon'], string> = {
        bird: t('sound.bird'),
        cat: t('sound.cat'),
        clap: t('sound.clap'),
        whistle: t('setup.whistle'),
    };
    const initialNames: Record<SetupRound['icon'], string> = {
        bird: 'Bird',
        cat: 'Cat',
        clap: 'Clap',
        whistle: 'Whistle',
    };
    return round.name === initialNames[round.icon] ? defaultNames[round.icon] : round.name;
}

export default function RoundBuilder({
    onAdd,
    onDelete,
    onSelect,
    onToggleChallenge,
    onUpdateName,
    rounds,
    selectedRoundId,
}: RoundBuilderProps) {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string>();
    const [draftName, setDraftName] = useState('');
    const [playingId, setPlayingId] = useState<string>();

    function saveName(round: SetupRound) {
        onUpdateName(round.id, draftName.trim() || getRoundName(round, t));
        setEditingId(undefined);
    }

    return (
        <section className="setup-panel setup-rounds-panel">
            <SetupStepHeader
                action={
                    <button
                        className="setup-add-round"
                        onClick={onAdd}
                        type="button"
                    >
                        <AddRounded /> {t('setup.addRound')}
                    </button>
                }
                description={t('setup.roundsDescription')}
                number={2}
                title={t('setup.buildRounds')}
                tone="violet"
            />

            <div className="setup-round-list">
                {rounds.map((round, index) => {
                    const name = getRoundName(round, t);
                    const selected = round.id === selectedRoundId;
                    const playing = round.id === playingId;
                    return (
                        <article
                            className={`setup-round setup-round--${round.tone}${selected ? ' is-selected' : ''}`}
                            key={round.id}
                            onClick={() => onSelect(round.id)}
                        >
                            <header>
                                <span>{t('setup.round', { number: index + 1 })}</span>
                                <span className="setup-round__icon">
                                    <SetupSoundIcon icon={round.icon} />
                                </span>
                                {editingId === round.id ? (
                                    <label className="setup-round__name-editor">
                                        <span>{t('setup.soundName')}</span>
                                        <input
                                            autoFocus
                                            maxLength={24}
                                            onChange={(event) => setDraftName(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') saveName(round);
                                            }}
                                            value={draftName}
                                        />
                                    </label>
                                ) : (
                                    <strong>{name}</strong>
                                )}
                                <button
                                    aria-label={t(editingId === round.id ? 'setup.saveSoundName' : 'setup.editSoundName', { name })}
                                    className="setup-round__edit"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (editingId === round.id) saveName(round);
                                        else {
                                            setDraftName(name);
                                            setEditingId(round.id);
                                        }
                                    }}
                                    type="button"
                                >
                                    {editingId === round.id ? <CheckRounded /> : <EditRounded />}
                                </button>
                                <button
                                    aria-label={t('setup.toggleChallenge', { number: index + 1 })}
                                    className={`setup-round__challenge setup-round__challenge--${round.challenge}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onToggleChallenge(round.id);
                                    }}
                                    type="button"
                                >
                                    {t(`setup.${round.challenge}`)}
                                </button>
                                <MoreVertRounded aria-hidden="true" />
                            </header>
                            <div className="setup-round__body">
                                <button
                                    aria-label={t(playing ? 'setup.pauseClip' : 'setup.playClip', { name })}
                                    className="setup-round__play"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setPlayingId((current) => (current === round.id ? undefined : round.id));
                                    }}
                                    type="button"
                                >
                                    {playing ? <PauseRounded /> : <PlayArrowRounded />}
                                </button>
                                <SetupWaveform
                                    active={playing}
                                    tone={round.tone}
                                />
                                <span className="setup-round__file">
                                    <strong>{round.fileName}</strong>
                                    <small>{t('setup.secondsShort', { value: round.duration.toFixed(1) })}</small>
                                </span>
                            </div>
                            <footer>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelect(round.id);
                                    }}
                                    type="button"
                                >
                                    <ContentCutRounded /> {t('setup.editClip')}
                                </button>
                                <button
                                    disabled={rounds.length === 1}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete(round.id);
                                    }}
                                    type="button"
                                >
                                    <DeleteOutlineRounded /> {t('setup.delete')}
                                </button>
                            </footer>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
