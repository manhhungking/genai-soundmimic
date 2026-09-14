import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useSoundRecorder, { type RecordingResult } from './useSoundRecorder';

class TestMediaRecorder extends EventTarget {
    static isTypeSupported() {
        return true;
    }

    mimeType = 'audio/webm';
    state: RecordingState = 'inactive';

    constructor(public stream: MediaStream) {
        super();
    }

    start() {
        this.state = 'recording';
    }

    pause() {
        this.state = 'paused';
    }

    resume() {
        this.state = 'recording';
    }

    stop() {
        this.state = 'inactive';
        const dataEvent = new Event('dataavailable') as BlobEvent;
        Object.defineProperty(dataEvent, 'data', { value: new Blob(['real-audio'], { type: this.mimeType }) });
        this.dispatchEvent(dataEvent);
        this.dispatchEvent(new Event('stop'));
    }
}

describe('useSoundRecorder', () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn(async () => ({
        getTracks: () => [{ stop: stopTrack }],
    }) as unknown as MediaStream);

    beforeEach(() => {
        stopTrack.mockClear();
        getUserMedia.mockClear();
        vi.stubGlobal('MediaRecorder', TestMediaRecorder);
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('requests microphone access only after a player action and returns the real recorded blob', async () => {
        const completed = vi.fn<(result: RecordingResult) => void>();
        const { result } = renderHook(() => useSoundRecorder(completed));

        expect(getUserMedia).not.toHaveBeenCalled();
        await act(async () => {
            await result.current.start(2);
        });
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledWith({
            audio: {
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
            },
            video: false,
        });
        expect(result.current.recording).toBe(true);

        act(() => result.current.stop());
        await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));

        const recording = completed.mock.calls[0][0];
        expect(recording.blob.type).toBe('audio/webm');
        expect(recording.blob.size).toBeGreaterThan(0);
        expect(recording.dataUrl).toMatch(/^data:audio\/webm;base64,/);
        expect(stopTrack).toHaveBeenCalledOnce();
        expect(result.current.recording).toBe(false);
    });
});
