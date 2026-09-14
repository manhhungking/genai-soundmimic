import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import WifiRounded from '@mui/icons-material/WifiRounded';
import { useEffect, useState, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import Waveform from '../../components/Waveform';
import type { SavedGameSetup, SetupSoundIcon } from '../setup/model';
import type { GameSnapshot } from './model';
import StageScene, { type AvatarAssetIssue } from './StageScene';

const soundEmoji: Record<SetupSoundIcon, string> = {
    bird: '🐦',
    cat: '🐱',
    clap: '👏',
    whistle: '🎵',
};

const performerPhases = new Set<GameSnapshot['phase']>([
    'entering',
    'ready',
    'recording',
    'performing',
    'result',
]);

type PlayStageProps = {
    audioBlocked: boolean;
    audioLevel: MutableRefObject<number>;
    connectionReady: boolean;
    elapsedSeconds: number;
    isHost: boolean;
    onAdvance: () => void;
    onBegin: () => void;
    onResumeAudio: () => void;
    onResumeReference: () => void;
    onReveal: () => void;
    onRetry: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    recording: boolean;
    recordingDuration: number;
    referenceBlocked: boolean;
    setup: SavedGameSetup;
    snapshot: GameSnapshot;
    viewerPlayerId: string;
};

function phaseKey(snapshot: GameSnapshot) {
    if (snapshot.paused) return 'play.phasePaused';
    return `play.phase.${snapshot.phase}`;
}

export default function PlayStage({
    audioBlocked,
    audioLevel,
    connectionReady,
    elapsedSeconds,
    isHost,
    onAdvance,
    onBegin,
    onResumeAudio,
    onResumeReference,
    onReveal,
    onRetry,
    onStartRecording,
    onStopRecording,
    recording,
    recordingDuration,
    referenceBlocked,
    setup,
    snapshot,
    viewerPlayerId,
}: PlayStageProps) {
    const { t } = useTranslation();
    const [avatarAssetIssues, setAvatarAssetIssues] = useState<AvatarAssetIssue[]>([]);
    const round = setup.rounds[snapshot.roundIndex] ?? setup.rounds[0];
    const activePlayer = snapshot.players.find(({ id }) => id === snapshot.activePlayerId);
    const connectedPlayers = snapshot.players.filter(({ connected }) => connected);
    const canAct = viewerPlayerId === snapshot.activePlayerId && !snapshot.paused;
    const prediction = snapshot.predictions[0];
    const confidence = prediction ? Math.round(prediction.probability * 100) : 0;
    const performerOnStage = performerPhases.has(snapshot.phase);
    const assetIssueDetails = avatarAssetIssues.map(({ missingMotions, modelUrl }) => (
        missingMotions?.length ? `${modelUrl}: ${missingMotions.join(', ')}` : modelUrl
    )).join('\n');

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
                onAssetIssues={setAvatarAssetIssues}
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
                </div>
                <div className={`play-stage__connection${connectionReady ? ' is-ready' : ''}`}>
                    <WifiRounded />
                    <span>{t(connectionReady ? 'play.connected' : 'play.connecting')}</span>
                </div>
            </header>

            {activePlayer && snapshot.phase !== 'complete' && (
                <div className={`play-stage__turn-bubble${performerOnStage ? ' is-on-stage' : ' is-waiting'}`}>
                    <strong>{t('play.personTurn', { name: activePlayer.name })}</strong>
                    <span>{t(phaseKey(snapshot))}</span>
                </div>
            )}

            {avatarAssetIssues.length > 0 && (
                <div className="play-stage__asset-notice" role="status" title={assetIssueDetails}>
                    <ErrorOutlineRounded />
                    <span>{t('play.riggedAvatarsUnavailable', { count: avatarAssetIssues.length })}</span>
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
                            <span>{t(canAct ? 'play.yourTurn' : 'play.waitForPlayer', { name: activePlayer?.name })}</span>
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
                    {snapshot.phase === 'ready' && canAct && (
                        <button className="play-stage__record" onClick={onStartRecording} type="button">
                            <MicRounded />
                            <span>{t('play.recordNow')}</span>
                            <small>{t('play.secondsAvailable', { count: recordingDuration })}</small>
                        </button>
                    )}
                    {snapshot.phase === 'recording' && canAct && recording && (
                        <button className="play-stage__stop" onClick={onStopRecording} type="button">
                            <StopRounded /> {t('play.stopRecording')}
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
