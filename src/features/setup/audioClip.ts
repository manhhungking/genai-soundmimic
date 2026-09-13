import type { SetupRound, SetupSoundIcon } from './model';
import {
    blobToDataUrl,
    decodeAudioDataUrl,
    encodeWav,
    startAudioPlayback,
    trimAudioBuffer,
} from '../../util/audio';

const fallbackDuration = 3;
const fallbackSampleRate = 16_000;

function seededNoise(seed: number) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1_664_525 + 1_013_904_223) >>> 0;
        return (value / 0xffffffff) * 2 - 1;
    };
}

function envelope(time: number, start: number, length: number) {
    const progress = (time - start) / length;
    if (progress <= 0 || progress >= 1) return 0;
    return Math.sin(Math.PI * progress) ** 1.7;
}

function synthesizeSample(icon: SetupSoundIcon, time: number, noise: () => number) {
    if (icon === 'bird') {
        const chirps = [0.18, 0.72, 1.28, 1.92, 2.42];
        return chirps.reduce((sample, start) => {
            const local = time - start;
            const gain = envelope(time, start, 0.32);
            const phase = 2 * Math.PI * (1_150 * local + 1_600 * local * local);
            return sample + Math.sin(phase) * gain * 0.32;
        }, 0);
    }

    if (icon === 'clap') {
        const claps = [0.25, 0.9, 1.55, 2.18];
        return claps.reduce((sample, start) => {
            const local = time - start;
            if (local < 0 || local > 0.16) return sample;
            return sample + noise() * Math.exp(-local * 28) * 0.75;
        }, 0);
    }

    if (icon === 'cat') {
        const gain = envelope(time, 0.18, 2.55);
        const frequency = 360 + 170 * Math.sin(Math.PI * Math.min(1, time / 2.4));
        const vibrato = 15 * Math.sin(2 * Math.PI * 5.4 * time);
        return Math.sin(2 * Math.PI * (frequency + vibrato) * time) * gain * 0.34;
    }

    const gain = envelope(time, 0.12, 2.72);
    const frequency = 1_280 + 65 * Math.sin(2 * Math.PI * 0.8 * time);
    return Math.sin(2 * Math.PI * frequency * time) * gain * 0.28;
}

function createFallbackSource(context: AudioContext, round: SetupRound) {
    const duration = Math.max(fallbackDuration, round.sourceDuration ?? 0, round.end);
    const buffer = context.createBuffer(1, Math.ceil(duration * fallbackSampleRate), fallbackSampleRate);
    const channel = buffer.getChannelData(0);
    const noise = seededNoise(round.id.split('').reduce((seed, character) => seed + character.charCodeAt(0), 0));

    for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.max(-1, Math.min(1, synthesizeSample(round.icon, index / fallbackSampleRate, noise)));
    }
    return buffer;
}

async function getSourceBuffer(context: AudioContext, round: SetupRound) {
    if (round.sourceAudioDataUrl) return decodeAudioDataUrl(context, round.sourceAudioDataUrl);
    return createFallbackSource(context, round);
}

export async function createTrimmedRoundAudio(round: SetupRound, start: number, end: number) {
    const context = new AudioContext();
    try {
        const source = await getSourceBuffer(context, round);
        const clip = trimAudioBuffer(context, source, start, end);
        return blobToDataUrl(encodeWav(clip));
    } finally {
        void context.close();
    }
}

export async function playRoundSelection(
    round: SetupRound,
    start: number,
    end: number,
    onEnded: () => void,
) {
    const context = new AudioContext();
    try {
        const buffer = await getSourceBuffer(context, round);
        const safeStart = Math.max(0, Math.min(start, buffer.duration));
        const duration = Math.max(0.1, Math.min(end, buffer.duration) - safeStart);
        return await startAudioPlayback(context, buffer, safeStart, duration, onEnded);
    } catch (error) {
        void context.close();
        throw error;
    }
}

export async function playConfiguredRound(round: SetupRound, onEnded: () => void) {
    const context = new AudioContext();
    try {
        if (round.clipAudioDataUrl) {
            const clip = await decodeAudioDataUrl(context, round.clipAudioDataUrl);
            return await startAudioPlayback(context, clip, 0, clip.duration, onEnded);
        }
        const source = await getSourceBuffer(context, round);
        const start = Math.max(0, Math.min(round.start, source.duration));
        return await startAudioPlayback(context, source, start, Math.min(round.duration, source.duration - start), onEnded);
    } catch (error) {
        void context.close();
        throw error;
    }
}
