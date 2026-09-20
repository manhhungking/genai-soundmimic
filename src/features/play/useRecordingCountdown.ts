import { useEffect, useRef, useState } from 'react';

export const recordingCountdownSeconds = 3;

export default function useRecordingCountdown(
    active: boolean,
    turnKey: string,
    onComplete: () => void,
) {
    const [countdown, setCountdown] = useState<number | null>(null);
    const completeRef = useRef(onComplete);

    useEffect(() => {
        completeRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (!active) {
            // The countdown is a timer-backed external process, so reset its
            // visible state whenever that process is no longer active.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCountdown(null);
            return;
        }

        setCountdown(recordingCountdownSeconds);
        let remaining = recordingCountdownSeconds;
        const timer = window.setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                setCountdown(remaining);
                return;
            }
            window.clearInterval(timer);
            setCountdown(0);
            completeRef.current();
        }, 1_000);

        return () => window.clearInterval(timer);
    }, [active, turnKey]);

    return countdown;
}
