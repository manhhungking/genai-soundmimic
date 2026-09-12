import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { SetupTone } from './model';

const bars = [18, 38, 55, 31, 68, 45, 73, 50, 61, 82, 47, 65, 40, 71, 53, 35, 49, 29, 42, 24, 35];

type SetupWaveformProps = {
    active?: boolean;
    tone: SetupTone;
};

export default function SetupWaveform({ active = false, tone }: SetupWaveformProps) {
    const { t } = useTranslation();

    return (
        <span
            aria-label={t(active ? 'media.activeWaveform' : 'media.recordedWaveform')}
            className={`setup-waveform setup-waveform--${tone}${active ? ' is-active' : ''}`}
            role="img"
        >
            {bars.map((height, index) => (
                <i
                    key={`${height}-${index}`}
                    style={{ '--setup-bar-height': `${height}%`, '--setup-bar-delay': `${index * -42}ms` } as CSSProperties}
                />
            ))}
        </span>
    );
}
