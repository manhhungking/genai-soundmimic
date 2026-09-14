import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAudioPerformance() {
    const [blocked, setBlocked] = useState(false);
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | undefined>(undefined);
    const contextRef = useRef<AudioContext | undefined>(undefined);
    const analyserRef = useRef<AnalyserNode | undefined>(undefined);
    const frameRef = useRef<number | undefined>(undefined);
    const levelRef = useRef(0);
    const endedRef = useRef<() => void>(() => undefined);

    const stopLevelLoop = useCallback(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
        levelRef.current = 0;
    }, []);

    const startLevelLoop = useCallback(() => {
        const analyser = analyserRef.current;
        if (!analyser) return;
        const values = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
            analyser.getByteFrequencyData(values);
            const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
            levelRef.current += (average / 255 - levelRef.current) * 0.35;
            frameRef.current = requestAnimationFrame(update);
        };
        update();
    }, []);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }
        const context = contextRef.current;
        audioRef.current = undefined;
        contextRef.current = undefined;
        analyserRef.current = undefined;
        setPlaying(false);
        stopLevelLoop();
        if (context && context.state !== 'closed') void context.close();
    }, [stopLevelLoop]);

    const play = useCallback(async (dataUrl: string, onEnded: () => void) => {
        stop();
        const audio = new Audio(dataUrl);
        const context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioRef.current = audio;
        contextRef.current = context;
        analyserRef.current = analyser;
        endedRef.current = onEnded;
        audio.addEventListener('ended', () => {
            setPlaying(false);
            stopLevelLoop();
            endedRef.current();
        }, { once: true });
        try {
            await context.resume();
            await audio.play();
            setBlocked(false);
            setPlaying(true);
            startLevelLoop();
        } catch {
            setBlocked(true);
            setPlaying(false);
        }
    }, [startLevelLoop, stop, stopLevelLoop]);

    const resumeBlocked = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
            await contextRef.current?.resume();
            await audio.play();
            setBlocked(false);
            setPlaying(true);
            startLevelLoop();
        } catch {
            setBlocked(true);
        }
    }, [startLevelLoop]);

    const setPaused = useCallback((paused: boolean) => {
        const audio = audioRef.current;
        if (!audio) return;
        if (paused) {
            audio.pause();
            setPlaying(false);
            stopLevelLoop();
        } else if (!blocked) {
            void audio.play().then(() => {
                setPlaying(true);
                startLevelLoop();
            }).catch(() => setBlocked(true));
        }
    }, [blocked, startLevelLoop, stopLevelLoop]);

    useEffect(() => () => {
        stop();
    }, [stop]);

    return { blocked, levelRef, play, playing, resumeBlocked, setPaused, stop };
}
