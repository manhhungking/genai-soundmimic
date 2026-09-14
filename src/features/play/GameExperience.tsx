import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioPlayback } from '../../util/audio';
import { playConfiguredRound } from '../setup/audioClip';
import { getRecordingDuration, type SavedGameSetup } from '../setup/model';
import PlayStage from './PlayStage';
import type { GameSnapshot } from './model';
import useAudioPerformance from './useAudioPerformance';
import useSoundRecorder, { type RecordingResult } from './useSoundRecorder';

type GameExperienceProps = {
    connectionReady: boolean;
    isHost: boolean;
    onAdvance: () => void;
    onBegin: () => void;
    onPerformanceEnded: () => void;
    onRecordingCancel: () => void;
    onRecordingComplete: (result: RecordingResult) => void;
    onRecordingStart: () => void;
    onReferenceEnded: () => void;
    onReveal: () => void;
    onRetry: () => void;
    setup: SavedGameSetup;
    snapshot: GameSnapshot;
    viewerPlayerId: string;
};

export default function GameExperience({
    connectionReady,
    isHost,
    onAdvance,
    onBegin,
    onPerformanceEnded,
    onRecordingCancel,
    onRecordingComplete,
    onRecordingStart,
    onReferenceEnded,
    onReveal,
    onRetry,
    setup,
    snapshot,
    viewerPlayerId,
}: GameExperienceProps) {
    const [referenceBlocked, setReferenceBlocked] = useState(false);
    const referenceRef = useRef<AudioPlayback | undefined>(undefined);
    const referenceEndedRef = useRef(onReferenceEnded);
    const {
        blocked: audioBlocked,
        levelRef: audioLevel,
        play: playPerformance,
        resumeBlocked: resumeAudio,
        setPaused: setPerformancePaused,
        stop: stopPerformance,
    } = useAudioPerformance();
    const {
        elapsedSeconds,
        error: recordingError,
        recording,
        setPaused: setRecordingPaused,
        start,
        stop,
    } = useSoundRecorder(onRecordingComplete);
    const duration = getRecordingDuration(setup, snapshot.roundIndex);

    useEffect(() => {
        referenceEndedRef.current = onReferenceEnded;
    }, [onReferenceEnded]);

    const stopReference = useCallback(() => {
        referenceRef.current?.stop();
        referenceRef.current = undefined;
    }, []);

    const playReference = useCallback(async () => {
        const round = setup.rounds[snapshot.roundIndex];
        if (!round) return;
        stopReference();
        try {
            referenceRef.current = await playConfiguredRound(round, () => {
                referenceRef.current = undefined;
                referenceEndedRef.current();
            });
            setReferenceBlocked(false);
        } catch {
            setReferenceBlocked(true);
        }
    }, [setup.rounds, snapshot.roundIndex, stopReference]);

    useEffect(() => {
        if (snapshot.phase !== 'reference' || snapshot.paused) {
            stopReference();
            return;
        }
        // Audio playback is the external subscription; blocked state is updated only after its promise settles.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void playReference();
        return stopReference;
    }, [playReference, snapshot.paused, snapshot.phase, stopReference]);

    useEffect(() => {
        if (snapshot.phase !== 'performing' || !snapshot.recordingDataUrl) {
            stopPerformance();
            return;
        }
        void playPerformance(snapshot.recordingDataUrl, onPerformanceEnded);
        return stopPerformance;
    }, [onPerformanceEnded, playPerformance, snapshot.phase, snapshot.recordingDataUrl, stopPerformance]);

    useEffect(() => {
        setRecordingPaused(snapshot.paused);
        setPerformancePaused(snapshot.paused);
    }, [setPerformancePaused, setRecordingPaused, snapshot.paused]);

    useEffect(() => {
        if (!recordingError) return;
        onRecordingCancel();
    }, [onRecordingCancel, recordingError]);

    const startRecording = useCallback(() => {
        onRecordingStart();
        void start(duration);
    }, [duration, onRecordingStart, start]);

    return (
        <GameExperienceView
            audioBlocked={audioBlocked}
            audioLevel={audioLevel}
            connectionReady={connectionReady}
            elapsedSeconds={elapsedSeconds}
            isHost={isHost}
            onAdvance={onAdvance}
            onBegin={onBegin}
            onResumeAudio={resumeAudio}
            onResumeReference={playReference}
            onReveal={onReveal}
            onRetry={onRetry}
            onStartRecording={startRecording}
            onStopRecording={stop}
            recording={recording}
            recordingDuration={duration}
            referenceBlocked={referenceBlocked}
            setup={setup}
            snapshot={snapshot}
            viewerPlayerId={viewerPlayerId}
        />
    );
}

// Kept as a named wrapper so tests can render the stage without opening media devices.
const GameExperienceView = PlayStage;
