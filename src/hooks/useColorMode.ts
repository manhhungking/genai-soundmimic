import { useEffect, useState } from 'react';

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'soundmimic-color-mode';

function getInitialMode(): ColorMode {
    try {
        const storedMode = window.localStorage.getItem(STORAGE_KEY);
        if (storedMode === 'light' || storedMode === 'dark') return storedMode;
    } catch {
        // Storage can be unavailable in strict privacy modes; the selector still works for this visit.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function useColorMode() {
    const [mode, setMode] = useState<ColorMode>(getInitialMode);

    useEffect(() => {
        document.documentElement.dataset.colorMode = mode;
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // Keep the in-memory preference when storage is unavailable.
        }
    }, [mode]);

    return {
        mode,
        setMode,
    };
}
