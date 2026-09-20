import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useRecordingCountdown from './useRecordingCountdown';

describe('useRecordingCountdown', () => {
    afterEach(() => vi.useRealTimers());

    it('counts down from three and starts recording once', () => {
        vi.useFakeTimers();
        const onComplete = vi.fn();
        const { result } = renderHook(() => useRecordingCountdown(true, 'student-1:0:1', onComplete));

        expect(result.current).toBe(3);
        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current).toBe(2);
        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current).toBe(1);
        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current).toBe(0);
        expect(onComplete).toHaveBeenCalledOnce();

        act(() => vi.advanceTimersByTime(3_000));
        expect(onComplete).toHaveBeenCalledOnce();
    });

    it('cancels the countdown when the viewer is no longer eligible to record', () => {
        vi.useFakeTimers();
        const onComplete = vi.fn();
        const { result, rerender } = renderHook(
            ({ active }) => useRecordingCountdown(active, 'student-1:0:1', onComplete),
            { initialProps: { active: true } },
        );

        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current).toBe(2);
        rerender({ active: false });
        expect(result.current).toBeNull();
        act(() => vi.advanceTimersByTime(3_000));
        expect(onComplete).not.toHaveBeenCalled();
    });
});
