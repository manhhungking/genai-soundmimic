export type AudioPlayback = {
    stop: () => void;
};

export async function decodeAudioDataUrl(context: AudioContext, dataUrl: string) {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('Unable to load audio');
    return context.decodeAudioData(await response.arrayBuffer());
}

export function trimAudioBuffer(context: AudioContext, source: AudioBuffer, start: number, end: number) {
    const safeStart = Math.max(0, Math.min(start, source.duration));
    const safeEnd = Math.max(safeStart + 0.1, Math.min(end, source.duration));
    const firstFrame = Math.floor(safeStart * source.sampleRate);
    const lastFrame = Math.min(source.length, Math.ceil(safeEnd * source.sampleRate));
    const frameCount = Math.max(1, lastFrame - firstFrame);
    const clip = context.createBuffer(source.numberOfChannels, frameCount, source.sampleRate);

    for (let channelIndex = 0; channelIndex < source.numberOfChannels; channelIndex += 1) {
        clip.copyToChannel(source.getChannelData(channelIndex).slice(firstFrame, lastFrame), channelIndex);
    }
    return clip;
}

function writeAscii(view: DataView, offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

export function encodeWav(buffer: AudioBuffer) {
    const channels = buffer.numberOfChannels;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const wav = new ArrayBuffer(44 + dataLength);
    const view = new DataView(wav);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    const channelData = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
    let offset = 44;
    for (let frame = 0; frame < buffer.length; frame += 1) {
        for (let channel = 0; channel < channels; channel += 1) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += bytesPerSample;
        }
    }
    return new Blob([wav], { type: 'audio/wav' });
}

export function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(String(reader.result)), { once: true });
        reader.addEventListener('error', () => reject(reader.error), { once: true });
        reader.readAsDataURL(blob);
    });
}

export async function dataUrlToBlob(dataUrl: string) {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('Unable to read recorded audio');
    return response.blob();
}

export async function startAudioPlayback(
    context: AudioContext,
    buffer: AudioBuffer,
    offset: number,
    duration: number,
    onEnded: () => void,
): Promise<AudioPlayback> {
    await context.resume();
    const source = context.createBufferSource();
    let complete = false;
    source.buffer = buffer;
    source.connect(context.destination);
    source.addEventListener('ended', () => {
        if (complete) return;
        complete = true;
        void context.close();
        onEnded();
    }, { once: true });
    source.start(0, offset, duration);

    return {
        stop: () => {
            if (complete) return;
            complete = true;
            source.stop();
            void context.close();
        },
    };
}
