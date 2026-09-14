import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToDataUrl } from '../../util/audio';

export type RecordingResult = {
    blob: Blob;
    dataUrl: string;
};

function preferredAudioType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return types.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function useSoundRecorder(onComplete: (result: RecordingResult) => void) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState('');
    const [recording, setRecording] = useState(false);
    const completeRef = useRef(onComplete);
    const recorderRef = useRef<MediaRecorder | undefined>(undefined);
    const streamRef = useRef<MediaStream | undefined>(undefined);
    const stopTimerRef = useRef<number | undefined>(undefined);
    const tickTimerRef = useRef<number | undefined>(undefined);
    const elapsedRef = useRef(0);
    const resumedAtRef = useRef(0);
    const durationRef = useRef(0);

    useEffect(() => {
        completeRef.current = onComplete;
    }, [onComplete]);

    const clearTimers = useCallback(() => {
        if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
        if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
        stopTimerRef.current = undefined;
        tickTimerRef.current = undefined;
    }, []);

    const updateElapsed = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder?.state === 'recording') {
            elapsedRef.current = Math.min(
                durationRef.current,
                elapsedRef.current + (performance.now() - resumedAtRef.current) / 1000,
            );
            resumedAtRef.current = performance.now();
        }
        setElapsedSeconds(elapsedRef.current);
    }, []);

    const cleanup = useCallback(() => {
        clearTimers();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = undefined;
    }, [clearTimers]);

    const stop = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder?.state !== 'recording' && recorder?.state !== 'paused') return;
        updateElapsed();
        clearTimers();
        recorder.stop();
    }, [clearTimers, updateElapsed]);

    const scheduleTimers = useCallback(() => {
        clearTimers();
        const remaining = Math.max(0, durationRef.current - elapsedRef.current);
        resumedAtRef.current = performance.now();
        tickTimerRef.current = window.setInterval(updateElapsed, 100);
        stopTimerRef.current = window.setTimeout(stop, remaining * 1000);
    }, [clearTimers, stop, updateElapsed]);

    const start = useCallback(async (durationSeconds: number) => {
        if (recording) return;
        setError('');
        setElapsedSeconds(0);
        elapsedRef.current = 0;
        durationRef.current = durationSeconds;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    autoGainControl: false,
                    echoCancellation: false,
                    noiseSuppression: false,
                },
                video: false,
            });
            const mimeType = preferredAudioType();
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            const chunks: Blob[] = [];
            recorderRef.current = recorder;
            streamRef.current = stream;
            recorder.addEventListener('dataavailable', (event) => {
                if (event.data.size) chunks.push(event.data);
            });
            recorder.addEventListener('stop', () => {
                const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                cleanup();
                recorderRef.current = undefined;
                setRecording(false);
                setElapsedSeconds(elapsedRef.current);
                void blobToDataUrl(blob).then((dataUrl) => completeRef.current({ blob, dataUrl }));
            }, { once: true });
            recorder.start(100);
            setRecording(true);
            scheduleTimers();
        } catch {
            cleanup();
            recorderRef.current = undefined;
            setRecording(false);
            setError('microphone');
        }
    }, [cleanup, recording, scheduleTimers]);

    const setPaused = useCallback((paused: boolean) => {
        const recorder = recorderRef.current;
        if (!recorder) return;
        if (paused && recorder.state === 'recording') {
            updateElapsed();
            clearTimers();
            recorder.pause();
        }
        if (!paused && recorder.state === 'paused') {
            recorder.resume();
            scheduleTimers();
        }
    }, [clearTimers, scheduleTimers, updateElapsed]);

    useEffect(() => () => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
        cleanup();
    }, [cleanup]);

    return { elapsedSeconds, error, recording, setPaused, start, stop };
}
