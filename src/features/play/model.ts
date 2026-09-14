import type { AvatarVariant, UserProfile } from '../../data/profile';
import type { SavedGameSetup } from '../setup/model';

export type GamePhase =
    | 'waiting'
    | 'reference'
    | 'entering'
    | 'ready'
    | 'recording'
    | 'performing'
    | 'result'
    | 'exiting'
    | 'complete';

export type GameParticipant = {
    avatar: AvatarVariant;
    connected: boolean;
    id: string;
    name: string;
    role: 'host' | 'student';
};

export type GamePrediction = {
    className: string;
    probability: number;
};

export type GameTurnResult = {
    attempt: number;
    playerId: string;
    predictions: GamePrediction[];
    recordingDataUrl: string;
    roundId: string;
};

export type GameSnapshot = {
    activePlayerId?: string;
    attempt: number;
    error?: string;
    history: GameTurnResult[];
    paused: boolean;
    phase: GamePhase;
    players: GameParticipant[];
    predictions: GamePrediction[];
    resultRevealed: boolean;
    recordingDataUrl?: string;
    revision: number;
    roundIndex: number;
    sessionId: string;
    xaiEnabled: boolean;
};

export function createGameSnapshot(
    sessionId: string,
    setup: SavedGameSetup,
    hostProfile: UserProfile,
): GameSnapshot {
    const host = setup.hostParticipates
        ? [{
            avatar: hostProfile.avatar,
            connected: true,
            id: 'host',
            name: hostProfile.name,
            role: 'host' as const,
        }]
        : [];

    return {
        activePlayerId: host[0]?.id,
        attempt: 1,
        history: [],
        paused: false,
        phase: 'waiting',
        players: host,
        predictions: [],
        resultRevealed: false,
        revision: 0,
        roundIndex: 0,
        sessionId,
        xaiEnabled: false,
    };
}

export function addGameParticipant(snapshot: GameSnapshot, participant: GameParticipant): GameSnapshot {
    const existingIndex = snapshot.players.findIndex(({ id }) => id === participant.id);
    const players = existingIndex >= 0
        ? snapshot.players.map((current, index) => index === existingIndex ? participant : current)
        : [...snapshot.players, participant];

    return revise(snapshot, {
        activePlayerId: snapshot.activePlayerId ?? players[0]?.id,
        players,
    });
}

export function disconnectGameParticipant(snapshot: GameSnapshot, playerId: string, roundCount: number): GameSnapshot {
    const players = snapshot.players.map((player) => player.id === playerId
        ? { ...player, connected: false }
        : player);
    if (snapshot.activePlayerId !== playerId) return revise(snapshot, { players });
    return advanceGameTurn(revise(snapshot, { players }), roundCount);
}

export function setGamePhase(snapshot: GameSnapshot, phase: GamePhase, patch: Partial<GameSnapshot> = {}) {
    return revise(snapshot, { ...patch, phase });
}

export function setGameControls(snapshot: GameSnapshot, paused: boolean, xaiEnabled: boolean) {
    if (snapshot.paused === paused && snapshot.xaiEnabled === xaiEnabled) return snapshot;
    return revise(snapshot, { paused, xaiEnabled });
}

export function completeGameAttempt(
    snapshot: GameSnapshot,
    result: Omit<GameTurnResult, 'attempt' | 'playerId' | 'roundId'>,
    setup: SavedGameSetup,
) {
    const playerId = snapshot.activePlayerId;
    const round = setup.rounds[snapshot.roundIndex];
    if (!playerId || !round) return snapshot;
    const completed: GameTurnResult = {
        ...result,
        attempt: snapshot.attempt,
        playerId,
        roundId: round.id,
    };
    return setGamePhase(snapshot, 'result', {
        history: [...snapshot.history, completed],
        predictions: result.predictions,
        resultRevealed: setup.rules.revealGuess,
        recordingDataUrl: result.recordingDataUrl,
    });
}

export function retryGameTurn(snapshot: GameSnapshot, setup: SavedGameSetup) {
    if (snapshot.attempt >= setup.rules.attempts) return snapshot;
    return setGamePhase(snapshot, setup.rules.playReference ? 'reference' : 'entering', {
        attempt: snapshot.attempt + 1,
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
    });
}

export function advanceGameTurn(snapshot: GameSnapshot, roundCount: number): GameSnapshot {
    const connectedPlayers = snapshot.players.filter(({ connected }) => connected);
    if (!connectedPlayers.length) {
        return setGamePhase(snapshot, 'waiting', {
            activePlayerId: undefined,
            attempt: 1,
            predictions: [],
            resultRevealed: false,
            recordingDataUrl: undefined,
        });
    }

    const currentIndex = connectedPlayers.findIndex(({ id }) => id === snapshot.activePlayerId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % connectedPlayers.length;
    const wrapped = currentIndex >= 0 && nextIndex === 0;
    const nextRoundIndex = wrapped ? snapshot.roundIndex + 1 : snapshot.roundIndex;
    if (nextRoundIndex >= roundCount) {
        return setGamePhase(snapshot, 'complete', {
            activePlayerId: undefined,
            attempt: 1,
            predictions: [],
            resultRevealed: false,
            recordingDataUrl: undefined,
        });
    }

    return setGamePhase(snapshot, 'exiting', {
        activePlayerId: connectedPlayers[nextIndex].id,
        attempt: 1,
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
        roundIndex: nextRoundIndex,
    });
}

export function beginCurrentTurn(snapshot: GameSnapshot, setup: SavedGameSetup) {
    if (!snapshot.activePlayerId) return snapshot;
    return setGamePhase(snapshot, setup.rules.playReference ? 'reference' : 'entering', {
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
    });
}

export function revealGameResult(snapshot: GameSnapshot) {
    if (snapshot.phase !== 'result' || snapshot.resultRevealed) return snapshot;
    return revise(snapshot, { resultRevealed: true });
}

function revise(snapshot: GameSnapshot, patch: Partial<GameSnapshot>): GameSnapshot {
    return { ...snapshot, ...patch, revision: snapshot.revision + 1 };
}
