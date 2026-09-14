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
    customRecordingSeconds: number;
    playReference: boolean;
    recordingTime: RecordingTime;
    revealGuess: boolean;
    showConfidence: boolean;
};

export type SavedGameSetup = {
    hostParticipates: boolean;
    modelMode: ModelMode;
    rounds: SetupRound[];
    rules: GameRules;
    selectedStudent: number;
    version: 2;
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
    customRecordingSeconds: 5,
    playReference: true,
    recordingTime: 'three',
    revealGuess: true,
    showConfidence: true,
};

export const setupStorageKey = 'soundmimic-game-setup';

export const defaultGameSetup: SavedGameSetup = {
    hostParticipates: false,
    modelMode: 'single',
    rounds: initialSetupRounds,
    rules: defaultGameRules,
    selectedStudent: 0,
    version: 2,
};

export function readGameSetup(): SavedGameSetup | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        const saved = JSON.parse(window.localStorage.getItem(setupStorageKey) ?? 'null') as
            | (Omit<Partial<SavedGameSetup>, 'version'> & { version?: number })
            | null;
        const selectedStudent = saved?.selectedStudent;
        if (
            (saved?.version === 1 || saved?.version === 2)
            && (saved.modelMode === 'rotate' || saved.modelMode === 'single')
            && Number.isInteger(selectedStudent)
            && typeof selectedStudent === 'number'
            && selectedStudent >= 0
            && selectedStudent < 4
            && Array.isArray(saved.rounds)
            && saved.rounds.length > 0
            && saved.rounds.every((round) => typeof round.id === 'string' && typeof round.name === 'string')
            && saved.rules !== null
            && typeof saved.rules === 'object'
        ) {
            const rules = saved.rules as Partial<GameRules>;
            return {
                hostParticipates: saved.hostParticipates === true,
                modelMode: saved.modelMode,
                rounds: saved.rounds,
                rules: {
                    ...defaultGameRules,
                    ...rules,
                    customRecordingSeconds: typeof rules.customRecordingSeconds === 'number'
                        ? Math.max(1, Math.min(30, rules.customRecordingSeconds))
                        : defaultGameRules.customRecordingSeconds,
                },
                selectedStudent,
                version: 2,
            };
        }
    } catch {
        // Ignore stale or malformed local setup data.
    }
    return undefined;
}

export function getRecordingDuration(setup: SavedGameSetup, roundIndex: number) {
    const round = setup.rounds[roundIndex] ?? setup.rounds[0];
    if (setup.rules.recordingTime === 'clip') return round?.duration ?? 3;
    if (setup.rules.recordingTime === 'custom') return setup.rules.customRecordingSeconds;
    return 3;
}
