import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { SoundSample } from './model';

const idleBars = [26, 45, 34, 57, 39, 69, 48, 61, 31, 53, 72, 42, 59, 35, 66, 45, 55, 28, 49, 37, 60, 33, 46, 25];
const waveformNoiseFloorDb = -50;
const waveformCeilingDb = -8;
const minimumBarHeight = 8;
const maximumBarHeight = 92;

type TrainingWaveformProps = {
    active?: boolean;
    fullWidth?: boolean;
    samples?: SoundSample[];
};

function createSignalBars(samples: SoundSample[]) {
    const chunks = samples.flatMap(({ data }) => data.rawAudio ? [data.rawAudio.data] : []);
    const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
    if (!totalLength) return idleBars;

    const duration = samples.reduce((total, { data }) => (
        total + (data.rawAudio ? data.rawAudio.data.length / data.rawAudio.sampleRateHz : 0)
    ), 0);
    const barCount = Math.max(18, Math.min(48, Math.round(duration * 8)));
    const squaredAmplitudes = Array.from({ length: barCount }, () => 0);
    const sampleCounts = Array.from({ length: barCount }, () => 0);
    let globalOffset = 0;

    for (const chunk of chunks) {
        for (let index = 0; index < chunk.length; index += 1) {
            const bin = Math.min(barCount - 1, Math.floor((globalOffset + index) / totalLength * barCount));
            squaredAmplitudes[bin] += chunk[index] ** 2;
            sampleCounts[bin] += 1;
        }
        globalOffset += chunk.length;
    }

    return squaredAmplitudes.map((sum, index) => {
        const rms = Math.sqrt(sum / Math.max(1, sampleCounts[index]));
        const decibels = 20 * Math.log10(Math.max(rms, 0.000001));
        const level = Math.min(1, Math.max(0, (
            decibels - waveformNoiseFloorDb
        ) / (waveformCeilingDb - waveformNoiseFloorDb)));
        return minimumBarHeight + Math.round(level * (maximumBarHeight - minimumBarHeight));
    });
}

export default function TrainingWaveform({
    active = false,
    fullWidth = false,
    samples = [],
}: TrainingWaveformProps) {
    const { t } = useTranslation();
    const signalBars = useMemo(() => samples.length ? createSignalBars(samples) : idleBars, [samples]);
    const duration = samples.reduce((total, { data }) => (
        total + (data.rawAudio ? data.rawAudio.data.length / data.rawAudio.sampleRateHz : 0)
    ), 0);
    const style = samples.length && !fullWidth
        ? ({ width: `${Math.max(104, Math.min(260, duration * 44))}px` } satisfies CSSProperties)
        : undefined;

    return (
        <div
            className={`training-waveform${active ? ' training-waveform--active' : ''}${samples.length ? ' training-waveform--clip' : ''}${fullWidth ? ' training-waveform--full' : ''}`}
            role="img"
            aria-label={t(active ? 'media.liveWaveform' : 'media.recordedSamples')}
            style={style}
        >
            {signalBars.map((height, index) => (
                <span
                    key={`${height}-${index}`}
                    style={{ height: `${height}%`, animationDelay: `${index * -40}ms` }}
                />
            ))}
        </div>
    );
}
