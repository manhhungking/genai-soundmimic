import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import ClipEditor from '../features/setup/ClipEditor';
import GameRulesPanel from '../features/setup/GameRulesPanel';
import ModelSelectionPanel from '../features/setup/ModelSelectionPanel';
import RoundBuilder from '../features/setup/RoundBuilder';
import { randomId } from '../util/randomId';
import {
    defaultGameRules,
    initialSetupRounds,
    readGameSetup,
    setupStorageKey,
    type GameRules,
    type ModelMode,
    type SetupRound,
    type SetupTone,
} from '../features/setup/model';

const roundTones: SetupTone[] = ['blue', 'orange', 'green', 'violet'];

export function Component() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [savedSetup] = useState(readGameSetup);
    const [modelMode, setModelMode] = useState<ModelMode>(savedSetup?.modelMode ?? 'rotate');
    const [selectedStudent, setSelectedStudent] = useState(savedSetup?.selectedStudent ?? 0);
    const [rounds, setRounds] = useState<SetupRound[]>(savedSetup?.rounds ?? initialSetupRounds);
    const [selectedRoundId, setSelectedRoundId] = useState((savedSetup?.rounds ?? initialSetupRounds)[0].id);
    const [rules, setRules] = useState<GameRules>(savedSetup?.rules ?? defaultGameRules);
    const [hostParticipates, setHostParticipates] = useState(savedSetup?.hostParticipates ?? false);
    const [notice, setNotice] = useState('');
    const selectedRound = useMemo(
        () => rounds.find((round) => round.id === selectedRoundId) ?? rounds[0],
        [rounds, selectedRoundId]
    );

    function updateRound(id: string, patch: Partial<SetupRound>) {
        setRounds((items) => items.map((round) => (round.id === id ? { ...round, ...patch } : round)));
        setNotice('');
    }

    function addRound() {
        const index = rounds.length;
        const id = randomId();
        const nextRound: SetupRound = {
            challenge: index % 2 ? 'break' : 'match',
            duration: 2.5,
            end: 2.7,
            fileName: 'new_sound.wav',
            icon: 'whistle',
            id,
            name: t('setup.newSound'),
            start: 0.2,
            tone: roundTones[index % roundTones.length],
        };
        setRounds((items) => [...items, nextRound]);
        setSelectedRoundId(id);
        setNotice('');
    }

    function deleteRound(id: string) {
        if (rounds.length === 1) return;
        const nextRounds = rounds.filter((round) => round.id !== id);
        setRounds(nextRounds);
        if (selectedRoundId === id) setSelectedRoundId(nextRounds[0].id);
        setNotice('');
    }

    function persistSetup() {
        window.localStorage.setItem(
            setupStorageKey,
            JSON.stringify({ hostParticipates, modelMode, rounds, rules, selectedStudent, version: 2 })
        );
        setNotice(t('setup.saved'));
    }

    function startGame() {
        persistSetup();
        navigate('/play');
    }

    return (
        <div className="setup-page">
            <header className="setup-hero">
                <div className="setup-hero__copy">
                    <h1>{t('setup.title')}</h1>
                    <p>{t('setup.description')}</p>
                </div>
            </header>

            <div className="setup-workflow">
                <ModelSelectionPanel
                    mode={modelMode}
                    onModeChange={(mode) => {
                        setModelMode(mode);
                        setNotice('');
                    }}
                    onSelectedStudentChange={setSelectedStudent}
                    selectedStudent={selectedStudent}
                />
                <span className="setup-connector"><ArrowForwardRounded /></span>
                <RoundBuilder
                    onAdd={addRound}
                    onDelete={deleteRound}
                    onSelect={setSelectedRoundId}
                    onToggleChallenge={(id) => {
                        const round = rounds.find((item) => item.id === id);
                        if (round) updateRound(id, { challenge: round.challenge === 'match' ? 'break' : 'match' });
                    }}
                    onUpdateName={(id, name) => updateRound(id, { name })}
                    rounds={rounds}
                    selectedRoundId={selectedRoundId}
                />
                <span className="setup-connector"><ArrowForwardRounded /></span>
                <div className="setup-workflow__right">
                    <GameRulesPanel
                        hostParticipates={hostParticipates}
                        mode={modelMode}
                        modelCount={modelMode === 'rotate' ? 4 : 1}
                        onChange={(nextRules) => {
                            setRules(nextRules);
                            setNotice('');
                        }}
                        onHostParticipatesChange={(participates) => {
                            setHostParticipates(participates);
                            setNotice('');
                        }}
                        roundCount={rounds.length}
                        rules={rules}
                    />
                    {selectedRound && (
                        <ClipEditor
                            key={selectedRound.id}
                            onUseClip={(start, end, clipAudioDataUrl) => {
                                updateRound(selectedRound.id, {
                                    clipAudioDataUrl,
                                    duration: end - start,
                                    end,
                                    start,
                                });
                                setNotice(t('setup.clipUpdated'));
                            }}
                            round={selectedRound}
                        />
                    )}
                </div>
            </div>

            <footer className="setup-footer">
                <span><LightbulbRounded /></span>
                <div>
                    <strong>{t('setup.readyTitle')}</strong>
                    <p>{t('setup.readyDescription')}</p>
                </div>
                {notice && <p className="setup-footer__notice" role="status">{notice}</p>}
                <button onClick={persistSetup} type="button"><SaveRounded /> {t('setup.saveSetup')}</button>
                <button className="is-primary" onClick={startGame} type="button">
                    <PlayArrowRounded /> {t('setup.startGame')}
                </button>
            </footer>
        </div>
    );
}
