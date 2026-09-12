import CheckRounded from '@mui/icons-material/CheckRounded';
import ContentCutRounded from '@mui/icons-material/ContentCutRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import SetupWaveform from './SetupWaveform';
import type { SetupRound } from './model';

type ClipEditorProps = {
    onUseClip: (start: number, end: number) => void;
    round: SetupRound;
};

export default function ClipEditor({ onUseClip, round }: ClipEditorProps) {
    const { t } = useTranslation();
    const [start, setStart] = useState<number | ''>(round.start);
    const [end, setEnd] = useState<number | ''>(round.end);
    const [playing, setPlaying] = useState(false);
    const startValue = start === '' ? 0 : start;
    const endValue = end === '' ? 3 : end;
    const duration = Math.max(0.1, endValue - startValue);
    const clipStyle = {
        '--clip-end': `${Math.min(100, (endValue / 3) * 100)}%`,
        '--clip-start': `${Math.max(0, (startValue / 3) * 100)}%`,
    } as CSSProperties;

    function updateStart(value: string) {
        setStart(value === '' ? '' : Math.max(0, Math.min(Number(value), endValue - 0.1)));
    }

    function updateEnd(value: string) {
        setEnd(value === '' ? '' : Math.min(3, Math.max(Number(value), startValue + 0.1)));
    }

    function reset() {
        setStart(round.start);
        setEnd(round.end);
        setPlaying(false);
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
                <i className="setup-clip-editor__handle setup-clip-editor__handle--start" />
                <i className="setup-clip-editor__handle setup-clip-editor__handle--end" />
            </div>
            <div className="setup-clip-editor__fields">
                <label>
                    {t('setup.startTime')}
                    <span><input min="0" max="2.9" step="0.1" type="number" value={start} onBlur={() => start === '' && setStart(0)} onChange={(event) => updateStart(event.target.value)} /> s</span>
                </label>
                <label>
                    {t('setup.endTime')}
                    <span><input min="0.1" max="3" step="0.1" type="number" value={end} onBlur={() => end === '' && setEnd(3)} onChange={(event) => updateEnd(event.target.value)} /> s</span>
                </label>
                <label>
                    {t('setup.duration')}
                    <span><output>{duration.toFixed(1)}</output> s</span>
                </label>
            </div>
            <footer>
                <button
                    onClick={() => setPlaying((value) => !value)}
                    type="button"
                >
                    {playing ? <PauseRounded /> : <PlayArrowRounded />} {t(playing ? 'setup.pauseSelection' : 'setup.playSelection')}
                </button>
                <button onClick={reset} type="button"><RestartAltRounded /> {t('setup.reset')}</button>
                <button className="is-primary" onClick={() => onUseClip(startValue, endValue)} type="button">
                    <CheckRounded /> {t('setup.useClip')}
                </button>
            </footer>
        </section>
    );
}
