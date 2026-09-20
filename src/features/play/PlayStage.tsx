import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import WifiRounded from '@mui/icons-material/WifiRounded';
import { useEffect, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import Waveform from '../../components/Waveform';
import type { SavedGameSetup, SetupSoundIcon } from '../setup/model';
import { computePlayerScores, computeTurnScore, type GameSnapshot } from './model';
import Scoreboard from './Scoreboard';
import StageScene from './StageScene';

const soundEmoji: Record<SetupSoundIcon, string> = {
    bird: '🐦',
    cat: '🐱',
    clap: '👏',
    whistle: '🎵',
};

// Mirrors StageScene's onStagePhases: everyone records from their waiting spot, so the
// performer only "docks" at the mic once they actually walk up to it.
const performerPhases = new Set<GameSnapshot['phase']>([
    'entering',
    'performing',
    'result',
]);

// Which of the round's four stages a given game phase belongs to, shown in capitals under
// the round card. Phases with no entry here (waiting/exiting/complete) show nothing.
const roundStageKey: Partial<Record<GameSnapshot['phase'], string>> = {
    entering: 'play.stagePlayback',
    performing: 'play.stagePlayback',
    ready: 'play.stageRecord',
    recording: 'play.stageRecord',
    reference: 'play.stageReveal',
    result: 'play.stageResult',
};

type PlayStageProps = {
    audioBlocked: boolean;
    audioLevel: MutableRefObject<number>;
    connectionReady: boolean;
    countdown: number | null;
    elapsedSeconds: number;
    isHost: boolean;
    onAdvance: () => void;
    onBegin: () => void;
    onResumeAudio: () => void;
    onResumeReference: () => void;
    onReveal: () => void;
    onRetry: () => void;
    onStartRecording: () => void;
    recordingDuration: number;
    referenceBlocked: boolean;
    setup: SavedGameSetup;
    snapshot: GameSnapshot;
    viewerPlayerId: string;
};

export default function PlayStage({
    audioBlocked,
    audioLevel,
    connectionReady,
    countdown,
    elapsedSeconds,
    isHost,
    onAdvance,
    onBegin,
    onResumeAudio,
    onResumeReference,
    onReveal,
    onRetry,
    onStartRecording,
    recordingDuration,
    referenceBlocked,
    setup,
    snapshot,
    viewerPlayerId,
}: PlayStageProps) {
    const { t } = useTranslation();
    const round = setup.rounds[snapshot.roundIndex] ?? setup.rounds[0];
    const activePlayer = snapshot.players.find(({ id }) => id === snapshot.activePlayerId);
    const connectedPlayers = snapshot.players.filter(({ connected }) => connected);
    const canAct = viewerPlayerId === snapshot.activePlayerId && !snapshot.paused;
    const prediction = snapshot.predictions[0];
    const confidence = prediction ? Math.round(prediction.probability * 100) : 0;
    const turnScore = round ? computeTurnScore(round, snapshot.predictions) : 0;
    const scores = computePlayerScores(snapshot);
    const performerOnStage = performerPhases.has(snapshot.phase);
    const roundStage = roundStageKey[snapshot.phase];

    useEffect(() => {
        const image = new Image();
        image.src = '/assets/soundmimic-stage-empty.png';
    }, []);

    return (
        <section
            aria-label={t('play.stage')}
            className={`play-stage phase-${snapshot.phase}${performerOnStage ? ' has-active-performer' : ''}`}
        >
            <div className="play-stage__backdrop" />
            <StageScene
                activePlayerId={snapshot.activePlayerId}
                audioLevel={audioLevel}
                phase={snapshot.phase}
                players={snapshot.players}
            />

            <header className="play-stage__hud">
                <div className="play-stage__round">
                    <span className="play-stage__round-label">
                        {t('play.roundProgress', { current: snapshot.roundIndex + 1, total: setup.rounds.length })}
                    </span>
                    <div>
                        <span aria-hidden="true" className="play-stage__round-emoji">
                            {soundEmoji[round?.icon ?? 'whistle']}
                        </span>
                        <strong>{round?.name ?? t('play.complete')}</strong>
                    </div>
                    {roundStage && <span className="play-stage__round-stage">{t(roundStage)}</span>}
                </div>
                <div className="play-stage__hud-right">
                    <div className={`play-stage__connection${connectionReady ? ' is-ready' : ''}`}>
                        <WifiRounded />
                        <span>{t(connectionReady ? 'play.connected' : 'play.connecting')}</span>
                    </div>
                    {snapshot.phase !== 'waiting' && (
                        <Scoreboard activePlayerId={snapshot.activePlayerId} scores={scores} />
                    )}
                </div>
            </header>

            {snapshot.phase === 'ready' && countdown !== null && (
                <div className="play-stage__countdown" role="status" aria-live="assertive">
                    <span>{t('play.recordingStartsIn')}</span>
                    <strong key={countdown}>{countdown || t('play.go')}</strong>
                </div>
            )}

            <footer className={`play-stage__action-bar phase-${snapshot.phase}`}>
                <div className="play-stage__status">
                    {snapshot.phase === 'waiting' && (
                        <>
                            <GroupsRounded />
                            <span>{t(connectedPlayers.length ? 'play.readyToBegin' : 'play.waitingPlayers')}</span>
                        </>
                    )}

                    {snapshot.phase === 'reference' && (
                        <>
                            <PlayArrowRounded />
                            <span>{t('play.listenReference')}</span>
                            <Waveform active compact />
                        </>
                    )}

                    {(snapshot.phase === 'entering' || snapshot.phase === 'exiting') && (
                        <span>{t(snapshot.phase === 'entering' ? 'play.walkingToMic' : 'play.changingTurns')}</span>
                    )}

                    {snapshot.phase === 'ready' && (
                        <>
                            <MicRounded />
                            <span>{t('play.everyoneGetReady')}</span>
                        </>
                    )}

                    {snapshot.phase === 'recording' && (
                        <>
                            <span className="play-stage__live-dot" />
                            <Waveform active compact />
                            <span>{t('play.recordingYourSound')}</span>
                            <strong>{elapsedSeconds.toFixed(1)} / {recordingDuration.toFixed(1)}s</strong>
                        </>
                    )}

                    {snapshot.phase === 'performing' && (
                        <>
                            <GraphicEqRounded />
                            <span>{t('play.playingPerformance', { name: activePlayer?.name })}</span>
                            <Waveform active compact />
                        </>
                    )}

                    {snapshot.phase === 'result' && prediction && snapshot.resultRevealed && (
                        <div className="play-stage__result">
                            <span aria-hidden="true">{soundEmoji[round?.icon ?? 'whistle']}</span>
                            <div>
                                <small>{t('play.aiGuess')}</small>
                                <strong>{prediction.className}</strong>
                            </div>
                            {setup.rules.showConfidence && (
                                <div className="play-stage__confidence">
                                    <span><i style={{ width: `${confidence}%` }} /></span>
                                    <strong>{confidence}%</strong>
                                </div>
                            )}
                            <div className="play-stage__score">
                                <small>{t('play.turnScore')}</small>
                                <strong>{t('play.scoreOutOf100', { score: turnScore })}</strong>
                            </div>
                        </div>
                    )}

                    {snapshot.phase === 'result' && prediction && !snapshot.resultRevealed && (
                        <span>{t('play.guessReady')}</span>
                    )}

                    {snapshot.phase === 'complete' && (
                        <div className="play-stage__complete">
                            <strong>{t('play.gameComplete')}</strong>
                            <span>{t('play.gameCompleteDescription')}</span>
                        </div>
                    )}
                </div>

                <div className="play-stage__actions">
                    {snapshot.phase === 'waiting' && isHost && connectedPlayers.length > 0 && (
                        <button className="play-stage__primary" onClick={onBegin} type="button">
                            {t('play.beginTurn')} <ArrowForwardRounded />
                        </button>
                    )}
                    {snapshot.phase === 'reference' && referenceBlocked && (
                        <button className="play-stage__primary" onClick={onResumeReference} type="button">
                            <PlayArrowRounded /> {t('play.playReference')}
                        </button>
                    )}
                    {snapshot.phase === 'ready' && canAct && countdown === null && !!snapshot.error && (
                        <button className="play-stage__record" onClick={onStartRecording} type="button">
                            <MicRounded />
                            <span>{t('play.recordNow')}</span>
                            <small>{t('play.secondsAvailable', { count: recordingDuration })}</small>
                        </button>
                    )}
                    {snapshot.phase === 'performing' && audioBlocked && (
                        <button className="play-stage__primary" onClick={onResumeAudio} type="button">
                            <PlayArrowRounded /> {t('play.playRecording')}
                        </button>
                    )}
                    {snapshot.phase === 'result' && prediction && !snapshot.resultRevealed && isHost && (
                        <button className="play-stage__primary" onClick={onReveal} type="button">
                            {t('play.revealGuess')} <ArrowForwardRounded />
                        </button>
                    )}
                    {snapshot.phase === 'result' && prediction && snapshot.resultRevealed && (
                        <>
                            {canAct && snapshot.attempt < setup.rules.attempts && (
                                <button onClick={onRetry} type="button"><ReplayRounded /> {t('play.tryAgain')}</button>
                            )}
                            {isHost && (
                                <button className="play-stage__primary" onClick={onAdvance} type="button">
                                    {t('play.nextTurn')} <ArrowForwardRounded />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </footer>

            {snapshot.error && (
                <div className="play-stage__error" role="alert"><ErrorOutlineRounded />{t(snapshot.error)}</div>
            )}

            {snapshot.paused && <div className="play-stage__paused"><strong>{t('play.paused')}</strong></div>}

            {snapshot.xaiEnabled && prediction && snapshot.resultRevealed && (
                <aside className="play-stage__xai" aria-label={t('play.xaiOverlay')}>
                    <header>
                        <GraphicEqRounded />
                        <div>
                            <strong>{t('play.whyGuess', { guess: prediction.className })}</strong>
                            <span>{t('play.xaiFromRecording')}</span>
                        </div>
                    </header>
                    <ol>
                        {snapshot.predictions.slice(0, 3).map((item) => (
                            <li key={item.className}>
                                <span>{item.className}</span>
                                <i><b style={{ width: `${Math.round(item.probability * 100)}%` }} /></i>
                                <strong>{Math.round(item.probability * 100)}%</strong>
                            </li>
                        ))}
                    </ol>
                </aside>
            )}
        </section>
    );
}
