import type { AvatarVariant, UserProfile } from '../../data/profile';
import type { SavedGameSetup, SetupRound } from '../setup/model';

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
    score: number;
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
    recordedPlayerIds: string[];
    recordingDataUrl?: string;
    revision: number;
    roundIndex: number;
    sessionId: string;
    xaiEnabled: boolean;
};

/**
 * Turns the classifier's predictions for a round into a 0-100 score.
 * "Match" rounds reward mimicking the target sound (the round's own name);
 * "break" rounds reward the opposite — sounding as unlike the target as possible.
 */
export function computeTurnScore(round: Pick<SetupRound, 'challenge' | 'name'>, predictions: GamePrediction[]) {
    const target = predictions.find(
        ({ className }) => className.trim().toLowerCase() === round.name.trim().toLowerCase(),
    );
    const matchConfidence = target?.probability ?? 0;
    const raw = round.challenge === 'break' ? 1 - matchConfidence : matchConfidence;
    return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

export type PlayerScore = {
    player: GameParticipant;
    roundsPlayed: number;
    total: number;
};

/** Sums each connected player's per-round scores, highest total first, for the scoreboard. */
export function computePlayerScores(snapshot: Pick<GameSnapshot, 'history' | 'players'>): PlayerScore[] {
    const totals = new Map<string, { roundsPlayed: number; total: number }>();
    for (const turn of snapshot.history) {
        const existing = totals.get(turn.playerId) ?? { roundsPlayed: 0, total: 0 };
        totals.set(turn.playerId, { roundsPlayed: existing.roundsPlayed + 1, total: existing.total + turn.score });
    }
    return snapshot.players
        .filter(({ connected }) => connected)
        .map((player) => ({ player, ...(totals.get(player.id) ?? { roundsPlayed: 0, total: 0 }) }))
        .sort((left, right) => right.total - left.total);
}

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
        recordedPlayerIds: [],
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
    result: Omit<GameTurnResult, 'attempt' | 'playerId' | 'roundId' | 'score'>,
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
        score: computeTurnScore(round, result.predictions),
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
    // Straight to 'ready' (not 'entering') — everyone re-records from where they're already
    // standing, nobody needs to walk anywhere until it's time to play a clip back.
    return setGamePhase(snapshot, setup.rules.playReference ? 'reference' : 'ready', {
        attempt: snapshot.attempt + 1,
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
        recordedPlayerIds: [],
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
            recordedPlayerIds: [],
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
            recordedPlayerIds: [],
        });
    }

    return setGamePhase(snapshot, 'exiting', {
        activePlayerId: connectedPlayers[nextIndex].id,
        attempt: 1,
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
        recordedPlayerIds: wrapped ? [] : snapshot.recordedPlayerIds,
        roundIndex: nextRoundIndex,
    });
}

export function beginCurrentTurn(snapshot: GameSnapshot, setup: SavedGameSetup) {
    if (!snapshot.activePlayerId) return snapshot;
    // Straight to 'ready' (not 'entering') — everyone records from where they're already
    // standing, nobody needs to walk anywhere until it's time to play a clip back.
    return setGamePhase(snapshot, setup.rules.playReference ? 'reference' : 'ready', {
        error: undefined,
        predictions: [],
        resultRevealed: false,
        recordingDataUrl: undefined,
        recordedPlayerIds: [],
    });
}

export function revealGameResult(snapshot: GameSnapshot) {
    if (snapshot.phase !== 'result' || snapshot.resultRevealed) return snapshot;
    return revise(snapshot, { resultRevealed: true });
}

function revise(snapshot: GameSnapshot, patch: Partial<GameSnapshot>): GameSnapshot {
    return { ...snapshot, ...patch, revision: snapshot.revision + 1 };
}
