export type ModelMode = 'rotate' | 'single';
export type ChallengeType = 'match' | 'break';
export type RecordingTime = 'three' | 'clip' | 'custom';
export type SetupSoundIcon = 'bird' | 'clap' | 'cat' | 'whistle';
export type SetupTone = 'blue' | 'orange' | 'green' | 'violet';

export type SetupRound = {
    challenge: ChallengeType;
    clipAudioDataUrl?: string;
    duration: number;
    end: number;
    fileName: string;
    icon: SetupSoundIcon;
    id: string;
    name: string;
    sourceAudioDataUrl?: string;
    sourceDuration?: number;
    start: number;
    tone: SetupTone;
};

export type GameRules = {
    attempts: 1 | 2;
    playReference: boolean;
    recordingTime: RecordingTime;
    revealGuess: boolean;
    showConfidence: boolean;
};

export type SavedGameSetup = {
    modelMode: ModelMode;
    rounds: SetupRound[];
    rules: GameRules;
    selectedStudent: number;
    version: 1;
};

export const initialSetupRounds: SetupRound[] = [
    {
        challenge: 'match',
        duration: 2.6,
        end: 2.8,
        fileName: 'bird_chirp.wav',
        icon: 'bird',
        id: 'round-bird',
        name: 'Bird',
        start: 0.2,
        tone: 'blue',
    },
    {
        challenge: 'break',
        duration: 1.8,
        end: 2.1,
        fileName: 'fast_clap.wav',
        icon: 'clap',
        id: 'round-clap',
        name: 'Clap',
        start: 0.3,
        tone: 'orange',
    },
    {
        challenge: 'match',
        duration: 2.3,
        end: 2.6,
        fileName: 'cat_meow.wav',
        icon: 'cat',
        id: 'round-cat',
        name: 'Cat',
        start: 0.3,
        tone: 'green',
    },
    {
        challenge: 'break',
        duration: 2.1,
        end: 2.4,
        fileName: 'whistle.wav',
        icon: 'whistle',
        id: 'round-whistle',
        name: 'Whistle',
        start: 0.3,
        tone: 'violet',
    },
];

export const defaultGameRules: GameRules = {
    attempts: 1,
    playReference: true,
    recordingTime: 'three',
    revealGuess: true,
    showConfidence: true,
};

export const setupStorageKey = 'soundmimic-game-setup';

export function readGameSetup(): SavedGameSetup | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        const saved = JSON.parse(window.localStorage.getItem(setupStorageKey) ?? 'null') as SavedGameSetup | null;
        if (
            saved?.version === 1
            && (saved.modelMode === 'rotate' || saved.modelMode === 'single')
            && Number.isInteger(saved.selectedStudent)
            && saved.selectedStudent >= 0
            && saved.selectedStudent < 4
            && Array.isArray(saved.rounds)
            && saved.rounds.length > 0
            && saved.rounds.every((round) => typeof round.id === 'string' && typeof round.name === 'string')
            && saved.rules !== null
            && typeof saved.rules === 'object'
        ) return saved;
    } catch {
        // Ignore stale or malformed local setup data.
    }
    return undefined;
}
