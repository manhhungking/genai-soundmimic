import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTrimmedRoundAudio, playRoundSelection } from './audioClip';
import type { SetupRound } from './model';

class FakeAudioBuffer {
    readonly duration: number;
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;
    private readonly channels: Float32Array[];

    constructor(numberOfChannels: number, length: number, sampleRate: number) {
        this.duration = length / sampleRate;
        this.length = length;
        this.numberOfChannels = numberOfChannels;
        this.sampleRate = sampleRate;
        this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    }

    copyToChannel(source: Float32Array, channelNumber: number) {
        this.channels[channelNumber].set(source);
    }

    getChannelData(channel: number) {
        return this.channels[channel];
    }
}

class FakeAudioContext {
    static lastStart: number[] = [];
    readonly destination = {} as AudioDestinationNode;

    createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
        return new FakeAudioBuffer(numberOfChannels, length, sampleRate) as unknown as AudioBuffer;
    }

    createBufferSource() {
        const source = new EventTarget() as EventTarget & {
            buffer: AudioBuffer | null;
            connect: () => void;
            start: (...values: number[]) => void;
            stop: () => void;
        };
        source.buffer = null;
        source.connect = () => undefined;
        source.start = (...values) => {
            FakeAudioContext.lastStart = values;
        };
        source.stop = () => undefined;
        return source as unknown as AudioBufferSourceNode;
    }

    resume() {
        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
}

const round: SetupRound = {
    challenge: 'match',
    duration: 2.6,
    end: 2.8,
    fileName: 'bird_chirp.wav',
    icon: 'bird',
    id: 'round-bird',
    name: 'Bird',
    start: 0.2,
    tone: 'blue',
};

describe('audio clip editing', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('encodes only the selected PCM frames into the saved WAV clip', async () => {
        vi.stubGlobal('AudioContext', FakeAudioContext);

        const dataUrl = await createTrimmedRoundAudio(round, 0.4, 1.4);
        const encoded = dataUrl.split(',')[1];
        const bytes = Uint8Array.from(window.atob(encoded), (character) => character.charCodeAt(0));
        const wav = new DataView(bytes.buffer);

        expect(dataUrl).toMatch(/^data:audio\/wav;base64,/);
        expect(wav.getUint32(24, true)).toBe(16_000);
        expect(wav.getUint32(40, true)).toBe(16_000 * 2);
    });

    it('previews exactly the selected source range', async () => {
        vi.stubGlobal('AudioContext', FakeAudioContext);

        const playback = await playRoundSelection(round, 0.4, 1.4, () => undefined);

        expect(FakeAudioContext.lastStart.slice(0, 2)).toEqual([0, 0.4]);
        expect(FakeAudioContext.lastStart[2]).toBeCloseTo(1);
        playback.stop();
    });
});
