import CheckRounded from '@mui/icons-material/CheckRounded';
import ContentCutRounded from '@mui/icons-material/ContentCutRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { AudioPlayback } from '../../util/audio';
import SetupWaveform from './SetupWaveform';
import {
    createTrimmedRoundAudio,
    playRoundSelection,
} from './audioClip';
import type { SetupRound } from './model';

type ClipEditorProps = {
    onUseClip: (start: number, end: number, clipAudioDataUrl?: string) => void;
    round: SetupRound;
};

export default function ClipEditor({ onUseClip, round }: ClipEditorProps) {
    const { t } = useTranslation();
    const [start, setStart] = useState<number | ''>(round.start);
    const [end, setEnd] = useState<number | ''>(round.end);
    const [playing, setPlaying] = useState(false);
    const [cutting, setCutting] = useState(false);
    const playbackRef = useRef<AudioPlayback | undefined>(undefined);
    const playbackRequestRef = useRef(0);
    const sourceDuration = Math.max(3, round.sourceDuration ?? 0, round.end);
    const startValue = start === '' ? 0 : start;
    const endValue = end === '' ? sourceDuration : end;
    const duration = Math.max(0.1, endValue - startValue);
    const clipStyle = {
        '--clip-end': `${Math.min(100, (endValue / sourceDuration) * 100)}%`,
        '--clip-start': `${Math.max(0, (startValue / sourceDuration) * 100)}%`,
    } as CSSProperties;

    useEffect(() => () => {
        playbackRequestRef.current += 1;
        playbackRef.current?.stop();
    }, []);

    function stopPlayback() {
        playbackRequestRef.current += 1;
        playbackRef.current?.stop();
        playbackRef.current = undefined;
        setPlaying(false);
    }

    function updateStart(value: string) {
        stopPlayback();
        setStart(value === '' ? '' : Math.max(0, Math.min(Number(value), endValue - 0.1)));
    }

    function updateEnd(value: string) {
        stopPlayback();
        setEnd(value === '' ? '' : Math.min(sourceDuration, Math.max(Number(value), startValue + 0.1)));
    }

    function reset() {
        stopPlayback();
        setStart(round.start);
        setEnd(round.end);
    }

    async function togglePlayback() {
        if (playing) {
            stopPlayback();
            return;
        }

        const request = playbackRequestRef.current + 1;
        playbackRequestRef.current = request;
        setPlaying(true);
        try {
            const playback = await playRoundSelection(round, startValue, endValue, () => {
                if (playbackRequestRef.current !== request) return;
                playbackRef.current = undefined;
                setPlaying(false);
            });
            if (playbackRequestRef.current !== request) playback.stop();
            else playbackRef.current = playback;
        } catch {
            if (playbackRequestRef.current === request) setPlaying(false);
        }
    }

    function useClip() {
        stopPlayback();
        onUseClip(startValue, endValue);
        setCutting(true);
        void createTrimmedRoundAudio(round, startValue, endValue)
            .then((clipAudioDataUrl) => onUseClip(startValue, endValue, clipAudioDataUrl))
            .catch(() => undefined)
            .finally(() => setCutting(false));
    }

    return (
        <section className="setup-panel setup-clip-editor">
            <header>
                <span><ContentCutRounded /></span>
                <h2>{t('setup.clipEditor')}</h2>
                <p>{t('setup.editingFile', { file: round.fileName })}</p>
            </header>
            <div
                className="setup-clip-editor__timeline"
                style={clipStyle}
            >
                <SetupWaveform
                    active={playing}
                    tone="blue"
                />
                <span className="setup-clip-editor__selection" />
                <input
                    aria-label={t('setup.clipStartHandle')}
                    className="setup-clip-editor__range setup-clip-editor__range--start"
                    max={sourceDuration - 0.1}
                    min="0"
                    onChange={(event) => updateStart(event.target.value)}
                    step="0.1"
                    type="range"
                    value={startValue}
                />
                <input
                    aria-label={t('setup.clipEndHandle')}
                    className="setup-clip-editor__range setup-clip-editor__range--end"
                    max={sourceDuration}
                    min="0.1"
                    onChange={(event) => updateEnd(event.target.value)}
                    step="0.1"
                    type="range"
                    value={endValue}
                />
            </div>
            <div className="setup-clip-editor__fields">
                <label>
                    {t('setup.startTime')}
                    <span><input min="0" max={sourceDuration - 0.1} step="0.1" type="number" value={start} onBlur={() => start === '' && setStart(0)} onChange={(event) => updateStart(event.target.value)} /> s</span>
                </label>
                <label>
                    {t('setup.endTime')}
                    <span><input min="0.1" max={sourceDuration} step="0.1" type="number" value={end} onBlur={() => end === '' && setEnd(sourceDuration)} onChange={(event) => updateEnd(event.target.value)} /> s</span>
                </label>
                <label>
                    {t('setup.duration')}
                    <span><output>{duration.toFixed(1)}</output> s</span>
                </label>
            </div>
            <footer>
                <button
                    onClick={() => void togglePlayback()}
                    type="button"
                >
                    {playing ? <PauseRounded /> : <PlayArrowRounded />} {t(playing ? 'setup.pauseSelection' : 'setup.playSelection')}
                </button>
                <button disabled={cutting} onClick={reset} type="button"><RestartAltRounded /> {t('setup.reset')}</button>
                <button className="is-primary" disabled={cutting} onClick={useClip} type="button">
                    <CheckRounded /> {t('setup.useClip')}
                </button>
            </footer>
        </section>
    );
}
