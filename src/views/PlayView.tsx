import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PsychologyRounded from '@mui/icons-material/PsychologyRounded';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router';
import type { AppOutletContext } from '../components/AppLayout';
import GameExperience from '../features/play/GameExperience';
import {
    advanceGameTurn,
    beginCurrentTurn,
    completeGameAttempt,
    retryGameTurn,
    revealGameResult,
    setGameControls,
    setGamePhase,
    type GamePrediction,
} from '../features/play/model';
import { useHostGameSession } from '../features/play/useGameSession';
import type { RecordingResult } from '../features/play/useSoundRecorder';
import { defaultGameSetup, getRecordingDuration, readGameSetup } from '../features/setup/model';
import { getActiveSoundClassifier } from '../features/training/activeClassifier';
import { predictSoundRecording } from '../features/training/soundClassifier';
import { dataUrlToBlob } from '../util/audio';

type PendingPerformance = {
    dataUrl: string;
    playbackEnded: boolean;
    predictions?: GamePrediction[];
};

type RoundRecording = {
    blob?: Blob;
    dataUrl: string;
};

export function Component() {
    const { t } = useTranslation();
    const { classCode, paused, profile, xaiEnabled } = useOutletContext<AppOutletContext>();
    const [setup] = useState(() => readGameSetup() ?? defaultGameSetup);
    const recordingHandlerRef = useRef<(playerId: string, dataUrl: string, blob?: Blob) => void>(() => undefined);
    const startHandlerRef = useRef<() => void>(() => undefined);
    const cancelHandlerRef = useRef<() => void>(() => undefined);
    const retryHandlerRef = useRef<() => void>(() => undefined);
    const pendingRef = useRef<PendingPerformance | undefined>(undefined);
    const roundRecordingsRef = useRef(new Map<string, RoundRecording>());
    const roundRecordingsRoundRef = useRef(0);

    const session = useHostGameSession({
        code: classCode,
        hostProfile: profile,
        onRecording: (playerId, dataUrl) => recordingHandlerRef.current(playerId, dataUrl),
        onRecordingCancel: () => cancelHandlerRef.current(),
        onRecordingStart: () => startHandlerRef.current(),
        onRetry: () => retryHandlerRef.current(),
        setup,
    });
    const { ready, setSnapshot, snapshot } = session;
    const snapshotRef = useRef(snapshot);

    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);

    const finishPerformance = useCallback(() => {
        const pending = pendingRef.current;
        if (!pending?.playbackEnded || !pending.predictions) return;
        setSnapshot((current) => current.phase === 'performing'
            && current.recordingDataUrl === pending.dataUrl
            ? completeGameAttempt(current, {
                predictions: pending.predictions ?? [],
                recordingDataUrl: pending.dataUrl,
            }, setup)
            : current);
        pendingRef.current = undefined;
    }, [setSnapshot, setup]);

    const startPerformance = useCallback((playerId: string) => {
        const captured = roundRecordingsRef.current.get(playerId);
        if (!captured) return;
        const model = getActiveSoundClassifier()?.app.model;
        if (!model?.isTrained()) {
            setSnapshot((current) => setGamePhase(current, 'ready', { error: 'play.modelRequired' }));
            return;
        }

        const pending: PendingPerformance = { dataUrl: captured.dataUrl, playbackEnded: false };
        pendingRef.current = pending;
        setSnapshot((current) => current.activePlayerId === playerId && current.phase === 'entering'
            ? setGamePhase(current, 'performing', {
                error: undefined,
                predictions: [],
                recordingDataUrl: captured.dataUrl,
            })
            : current);

        void (async () => {
            try {
                const blob = captured.blob ?? await dataUrlToBlob(captured.dataUrl);
                pending.predictions = await predictSoundRecording(model, blob);
                finishPerformance();
            } catch {
                pendingRef.current = undefined;
                setSnapshot((current) => current.phase === 'performing'
                    ? setGamePhase(current, 'ready', {
                        error: 'play.predictionFailed',
                        predictions: [],
                        recordingDataUrl: undefined,
                    })
                    : current);
            }
        })();
    }, [finishPerformance, setSnapshot]);

    const handleRecording = useCallback((playerId: string, dataUrl: string, sourceBlob?: Blob) => {
        const current = snapshotRef.current;
        if (current.phase !== 'recording' || roundRecordingsRef.current.has(playerId)) return;
        roundRecordingsRef.current.set(playerId, { blob: sourceBlob, dataUrl });
        const recordedPlayerIds = [...roundRecordingsRef.current.keys()];
        const expectedPlayerIds = current.players.filter(({ connected }) => connected).map(({ id }) => id);
        const allRecorded = expectedPlayerIds.every((id) => recordedPlayerIds.includes(id));
        setSnapshot((latest) => latest.phase === 'recording'
            ? setGamePhase(latest, allRecorded ? 'entering' : 'recording', { recordedPlayerIds })
            : latest);
    }, [setSnapshot]);

    const handleRecordingStart = useCallback(() => {
        setSnapshot((current) => current.phase === 'ready'
            ? setGamePhase(current, 'recording', { error: undefined })
            : current);
    }, [setSnapshot]);

    const handleRecordingCancel = useCallback(() => {
        setSnapshot((current) => current.phase === 'recording'
            ? setGamePhase(current, 'ready', { error: 'play.microphoneDenied' })
            : current);
    }, [setSnapshot]);

    const handleRetry = useCallback(() => {
        roundRecordingsRef.current.clear();
        roundRecordingsRoundRef.current = snapshotRef.current.roundIndex;
        setSnapshot((current) => retryGameTurn(current, setup));
    }, [setSnapshot, setup]);

    useEffect(() => {
        recordingHandlerRef.current = handleRecording;
        startHandlerRef.current = handleRecordingStart;
        cancelHandlerRef.current = handleRecordingCancel;
        retryHandlerRef.current = handleRetry;
    }, [handleRecording, handleRecordingCancel, handleRecordingStart, handleRetry]);

    useEffect(() => {
        setSnapshot((current) => setGameControls(current, paused, xaiEnabled));
    }, [paused, setSnapshot, xaiEnabled]);

    // Safety net: a dropped connection or a silently failed upload can otherwise leave the
    // whole class staring at a frozen "recording" bar forever, waiting for one player's clip
    // that will never arrive. If the round hasn't finished collecting everyone's recording
    // well past the recording duration, move on with whatever recordings did arrive instead
    // of hanging indefinitely.
    useEffect(() => {
        if (paused || snapshot.phase !== 'recording') return;
        const duration = getRecordingDuration(setup, snapshot.roundIndex);
        const timer = window.setTimeout(() => {
            setSnapshot((current) => {
                if (current.phase !== 'recording') return current;
                const recordedPlayerIds = [...roundRecordingsRef.current.keys()];
                return recordedPlayerIds.length
                    ? setGamePhase(current, 'entering', { recordedPlayerIds })
                    : setGamePhase(current, 'ready', { error: 'play.recordingTimedOut' });
            });
        }, (duration + 5) * 1000);
        return () => window.clearTimeout(timer);
    }, [paused, setSnapshot, setup, snapshot.phase, snapshot.roundIndex]);

    useEffect(() => {
        if (paused || (snapshot.phase !== 'entering' && snapshot.phase !== 'exiting')) return;
        const phase = snapshot.phase;
        const timer = window.setTimeout(() => {
            if (phase === 'entering' && snapshot.activePlayerId
                && roundRecordingsRef.current.has(snapshot.activePlayerId)) {
                startPerformance(snapshot.activePlayerId);
                return;
            }
            setSnapshot((current) => {
                if (current.phase !== phase) return current;
                if (phase === 'entering') return setGamePhase(current, 'ready');
                return roundRecordingsRoundRef.current === current.roundIndex
                    && !!current.activePlayerId
                    && roundRecordingsRef.current.has(current.activePlayerId)
                    ? setGamePhase(current, 'entering')
                    : beginCurrentTurn(current, setup);
            });
        }, phase === 'entering' ? 1250 : 950);
        return () => window.clearTimeout(timer);
    }, [paused, setSnapshot, setup, snapshot.activePlayerId, snapshot.phase, startPerformance]);

    const begin = useCallback(() => {
        if (!getActiveSoundClassifier()?.app.model?.isTrained()) {
            setSnapshot((current) => setGamePhase(current, 'waiting', { error: 'play.modelRequired' }));
            return;
        }
        roundRecordingsRef.current.clear();
        roundRecordingsRoundRef.current = snapshotRef.current.roundIndex;
        setSnapshot((current) => beginCurrentTurn(current, setup));
    }, [setSnapshot, setup]);

    const recordingComplete = useCallback(({ blob, dataUrl }: RecordingResult) => {
        handleRecording('host', dataUrl, blob);
    }, [handleRecording]);

    const performanceEnded = useCallback(() => {
        if (!pendingRef.current) return;
        pendingRef.current.playbackEnded = true;
        finishPerformance();
    }, [finishPerformance]);

    const advance = useCallback(() => {
        setSnapshot((current) => {
            const next = advanceGameTurn(current, setup.rounds.length);
            if (next.roundIndex !== current.roundIndex) {
                roundRecordingsRef.current.clear();
                roundRecordingsRoundRef.current = next.roundIndex;
            }
            return next;
        });
    }, [setSnapshot, setup.rounds.length]);

    const connectedCount = snapshot.players.filter(({ connected }) => connected).length;
    const hasModel = !!getActiveSoundClassifier()?.app.model?.isTrained();

    return (
        <div className="play-host-view">
            <header className="play-host-view__header">
                <div>
                    <h1>{t('play.title')}</h1>
                    <p>{t('play.hostDescription')}</p>
                </div>
                <div className="play-host-view__status">
                    <span><GroupsRounded /> {t('play.connectedPlayers', { count: connectedCount })}</span>
                    <span className={hasModel ? 'is-ready' : ''}>
                        <PsychologyRounded /> {t(hasModel ? 'play.classifierReady' : 'play.classifierMissing')}
                    </span>
                    {!hasModel && <Link to="/train">{t('play.openTraining')}</Link>}
                </div>
            </header>

            <GameExperience
                connectionReady={ready}
                isHost
                onAdvance={advance}
                onBegin={begin}
                onPerformanceEnded={performanceEnded}
                onRecordingCancel={() => cancelHandlerRef.current()}
                onRecordingComplete={recordingComplete}
                onRecordingStart={() => startHandlerRef.current()}
                onReferenceEnded={() => setSnapshot((current) => current.phase === 'reference'
                    // Straight to 'ready' — the countdown, not a walk to the mic, comes next.
                    ? setGamePhase(current, 'ready')
                    : current)}
                onRetry={() => retryHandlerRef.current()}
                onReveal={() => setSnapshot(revealGameResult)}
                setup={setup}
                snapshot={snapshot}
                viewerPlayerId="host"
            />
        </div>
    );
}
