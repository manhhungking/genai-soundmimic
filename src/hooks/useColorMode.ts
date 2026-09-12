import { createContext, createElement, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'soundmimic-color-mode';

type ColorModeContextValue = {
    mode: ColorMode;
    setMode: (mode: ColorMode) => void;
};

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

function getInitialMode(): ColorMode {
    if (typeof window === 'undefined') return 'light';
    try {
        const storedMode = window.localStorage.getItem(STORAGE_KEY);
        if (storedMode === 'light' || storedMode === 'dark') return storedMode;
    } catch {
        // Storage can be unavailable in strict privacy modes; the selector still works for this visit.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ColorModeProvider({ children }: PropsWithChildren) {
    const [mode, setMode] = useState<ColorMode>(getInitialMode);

    useEffect(() => {
        document.documentElement.dataset.colorMode = mode;
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // Keep the in-memory preference when storage is unavailable.
        }
    }, [mode]);

    const value = useMemo(() => ({ mode, setMode }), [mode]);

    return createElement(ColorModeContext.Provider, { value }, children);
}

export default function useColorMode() {
    const context = useContext(ColorModeContext);
    if (!context) throw new Error('useColorMode must be used inside ColorModeProvider');
    return context;
}
