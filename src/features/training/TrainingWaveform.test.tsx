import type { AudioExample } from '@genai-fi/classifier';
import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import i18n, { i18nReady } from '../../i18n';
import type { SoundSample } from './model';
import TrainingWaveform from './TrainingWaveform';

function createSample(id: string, amplitude: number): SoundSample {
    return {
        id,
        clipId: id,
        data: {
            label: 'Bird',
            spectrogram: { data: new Float32Array(0), frameSize: 232 },
            rawAudio: {
                data: new Float32Array(4_410).fill(amplitude),
                sampleRateHz: 44_100,
            },
        } satisfies AudioExample,
    };
}

function maximumRenderedHeight(container: HTMLElement) {
    return Math.max(...Array.from(container.querySelectorAll<HTMLElement>('.training-waveform span'))
        .map((bar) => Number.parseFloat(bar.style.height)));
}

describe('TrainingWaveform', () => {
    beforeAll(async () => {
        await i18nReady;
        await i18n.changeLanguage('en-GB');
    });

    it('keeps quiet recordings near the centre while preserving louder peaks', () => {
        const quiet = render(<TrainingWaveform samples={[createSample('quiet', 0.001)]} />);
        const loud = render(<TrainingWaveform samples={[createSample('loud', 0.25)]} />);

        expect(maximumRenderedHeight(quiet.container)).toBeLessThan(20);
        expect(maximumRenderedHeight(loud.container)).toBeGreaterThan(70);
    });
});
