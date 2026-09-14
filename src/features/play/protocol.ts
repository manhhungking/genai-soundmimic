import type { BuiltinEvent, Connection, PeerEvent } from '@genai-fi/base';
import type { AvatarVariant } from '../../data/profile';
import type { SavedGameSetup } from '../setup/model';
import type { GameSnapshot } from './model';

export type GameJoinEvent = PeerEvent & {
    event: 'game:join';
    player: {
        avatar: AvatarVariant;
        id: string;
        name: string;
    };
};

export type GameWelcomeEvent = PeerEvent & {
    event: 'game:welcome';
    playerId: string;
    setup: SavedGameSetup;
    snapshot: GameSnapshot;
    token: string;
};

export type GameSnapshotEvent = PeerEvent & {
    event: 'game:snapshot';
    setup: SavedGameSetup;
    snapshot: GameSnapshot;
};

export type GameRecordingEvent = PeerEvent & {
    event: 'game:recording';
    playerId: string;
    recordingDataUrl: string;
    token: string;
};

export type GameRecordStartEvent = PeerEvent & {
    event: 'game:record-start';
    playerId: string;
    token: string;
};

export type GameRecordCancelEvent = PeerEvent & {
    error: 'microphone';
    event: 'game:record-cancel';
    playerId: string;
    token: string;
};

export type GameRetryEvent = PeerEvent & {
    event: 'game:retry';
    playerId: string;
    token: string;
};

export type GameProtocol = BuiltinEvent
    | GameJoinEvent
    | GameWelcomeEvent
    | GameSnapshotEvent
    | GameRecordCancelEvent
    | GameRecordStartEvent
    | GameRecordingEvent
    | GameRetryEvent;

export type AuthorizedPlayer = {
    connectionId: string;
    playerId: string;
    token: string;
};

const maximumRecordingPayload = 16 * 1024 * 1024;

export function isValidRecordingAction(value: unknown): value is GameRecordingEvent {
    if (!value || typeof value !== 'object') return false;
    const event = value as Record<string, unknown>;
    return event.event === 'game:recording'
        && typeof event.playerId === 'string'
        && typeof event.token === 'string'
        && typeof event.recordingDataUrl === 'string'
        && event.recordingDataUrl.startsWith('data:audio/')
        && event.recordingDataUrl.length <= maximumRecordingPayload;
}

export function isAuthorizedPlayerAction(
    event: GameRecordCancelEvent | GameRecordStartEvent | GameRecordingEvent | GameRetryEvent,
    connection: Connection<GameProtocol>,
    authorization: AuthorizedPlayer | undefined,
    snapshot: GameSnapshot,
) {
    return authorization?.connectionId === connection.connectionId
        && authorization.playerId === event.playerId
        && authorization.token === event.token
        && snapshot.activePlayerId === event.playerId
        && snapshot.players.some(({ connected, id }) => connected && id === event.playerId);
}

export function gamePeerCode(code: string) {
    return `soundmimic-${code}`;
}

export function gameClientCode(playerId: string) {
    return `soundmimic-player-${playerId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32)}`;
}

export const peerConnectionConfig = {
    host: import.meta.env.VITE_APP_PEER_SERVER || 'api2.gen-ai.fi',
    key: import.meta.env.VITE_APP_PEER_KEY || 'genaikey',
    port: import.meta.env.VITE_APP_PEER_PORT ? Number(import.meta.env.VITE_APP_PEER_PORT) : 443,
    secure: import.meta.env.VITE_APP_PEER_SECURE !== '0',
} as const;
