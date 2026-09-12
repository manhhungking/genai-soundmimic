import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

const bars = [18, 32, 44, 28, 52, 37, 65, 43, 58, 72, 46, 56, 39, 62, 48, 34, 42, 30, 38, 25, 34, 21, 28];

type WaveformProps = {
    active?: boolean;
    compact?: boolean;
};

export default function Waveform({ active = false, compact = false }: WaveformProps) {
    const { t } = useTranslation();

    return (
        <div
            className={`waveform${active ? ' waveform--active' : ''}${compact ? ' waveform--compact' : ''}`}
            aria-label={t(active ? 'media.activeWaveform' : 'media.recordedWaveform')}
            role="img"
        >
            {bars.map((height, index) => (
                <span
                    key={`${height}-${index}`}
                    style={{ '--bar-height': `${height}%`, '--bar-delay': `${index * -45}ms` } as CSSProperties}
                />
            ))}
        </div>
    );
}
