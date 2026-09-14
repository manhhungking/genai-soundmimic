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
import { defaultGameSetup, readGameSetup } from '../features/setup/model';
import { getActiveSoundClassifier } from '../features/training/activeClassifier';
import { predictSoundRecording } from '../features/training/soundClassifier';
import { dataUrlToBlob } from '../util/audio';

type PendingPerformance = {
    dataUrl: string;
    playbackEnded: boolean;
    predictions?: GamePrediction[];
};

export function Component() {
    const { t } = useTranslation();
    const { classCode, paused, profile, xaiEnabled } = useOutletContext<AppOutletContext>();
    const [setup] = useState(() => readGameSetup() ?? defaultGameSetup);
    const recordingHandlerRef = useRef<(dataUrl: string, blob?: Blob) => void>(() => undefined);
    const startHandlerRef = useRef<() => void>(() => undefined);
    const cancelHandlerRef = useRef<() => void>(() => undefined);
    const retryHandlerRef = useRef<() => void>(() => undefined);
    const pendingRef = useRef<PendingPerformance | undefined>(undefined);

    const session = useHostGameSession({
        code: classCode,
        hostProfile: profile,
        onRecording: (dataUrl) => recordingHandlerRef.current(dataUrl),
        onRecordingCancel: () => cancelHandlerRef.current(),
        onRecordingStart: () => startHandlerRef.current(),
        onRetry: () => retryHandlerRef.current(),
        setup,
    });
    const { ready, setSnapshot, snapshot } = session;

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

    const handleRecording = useCallback(async (dataUrl: string, sourceBlob?: Blob) => {
        const activeClassifier = getActiveSoundClassifier();
        if (!activeClassifier?.app.model?.isTrained()) {
            setSnapshot((current) => setGamePhase(current, 'ready', { error: 'play.modelRequired' }));
            return;
        }

        const pending: PendingPerformance = { dataUrl, playbackEnded: false };
        pendingRef.current = pending;
        setSnapshot((current) => current.phase === 'recording'
            ? setGamePhase(current, 'performing', {
                error: undefined,
                predictions: [],
                recordingDataUrl: dataUrl,
            })
            : current);

        try {
            const blob = sourceBlob ?? await dataUrlToBlob(dataUrl);
            pending.predictions = await predictSoundRecording(activeClassifier.app.model, blob);
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
    }, [finishPerformance, setSnapshot]);

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

    useEffect(() => {
        if (paused || (snapshot.phase !== 'entering' && snapshot.phase !== 'exiting')) return;
        const phase = snapshot.phase;
        const timer = window.setTimeout(() => {
            setSnapshot((current) => {
                if (current.phase !== phase) return current;
                return phase === 'entering'
                    ? setGamePhase(current, 'ready')
                    : beginCurrentTurn(current, setup);
            });
        }, phase === 'entering' ? 1250 : 950);
        return () => window.clearTimeout(timer);
    }, [paused, setSnapshot, setup, snapshot.phase]);

    const begin = useCallback(() => {
        if (!getActiveSoundClassifier()?.app.model?.isTrained()) {
            setSnapshot((current) => setGamePhase(current, 'waiting', { error: 'play.modelRequired' }));
            return;
        }
        setSnapshot((current) => beginCurrentTurn(current, setup));
    }, [setSnapshot, setup]);

    const recordingComplete = useCallback(({ blob, dataUrl }: RecordingResult) => {
        void handleRecording(dataUrl, blob);
    }, [handleRecording]);

    const performanceEnded = useCallback(() => {
        if (!pendingRef.current) return;
        pendingRef.current.playbackEnded = true;
        finishPerformance();
    }, [finishPerformance]);

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
                onAdvance={() => setSnapshot((current) => advanceGameTurn(current, setup.rounds.length))}
                onBegin={begin}
                onPerformanceEnded={performanceEnded}
                onRecordingCancel={() => cancelHandlerRef.current()}
                onRecordingComplete={recordingComplete}
                onRecordingStart={() => startHandlerRef.current()}
                onReferenceEnded={() => setSnapshot((current) => current.phase === 'reference'
                    ? setGamePhase(current, 'entering')
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
