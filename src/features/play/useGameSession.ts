import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Peer2Peer,
    type Connection,
    type PeerErrorType,
    type PeerEvent,
} from '@genai-fi/base';
import { avatarOptions, type UserProfile } from '../../data/profile';
import { randomId } from '../../util/randomId';
import type { SavedGameSetup } from '../setup/model';
import {
    addGameParticipant,
    createGameSnapshot,
    disconnectGameParticipant,
    type GameSnapshot,
} from './model';
import {
    gameClientCode,
    gamePeerCode,
    isAuthorizedPlayerAction,
    isValidRecordingAction,
    peerConnectionConfig,
    type AuthorizedPlayer,
    type GameJoinEvent,
    type GameProtocol,
    type GameRecordCancelEvent,
    type GameRecordStartEvent,
    type GameRecordingEvent,
    type GameRetryEvent,
} from './protocol';

type SnapshotUpdater = GameSnapshot | ((current: GameSnapshot) => GameSnapshot);

type GamePeerCallbacks<T extends PeerEvent> = {
    onClose?: (connection?: Connection<T>) => void;
    onConnect?: (connection: Connection<T>) => void;
    onData?: (data: T, connection: Connection<T>) => void;
    onError?: (error: PeerErrorType) => void;
    onPeer?: (peer?: Peer2Peer<T>) => void;
};

type GamePeerOptions<T extends PeerEvent> = GamePeerCallbacks<T> & {
    code: string;
    disabled?: boolean;
    server?: string;
};

function getIceConfiguration() {
    const urls = (import.meta.env.VITE_APP_ICE_URLS || 'stun:stun.l.google.com:19302')
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean);

    return {
        expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        iceServers: [{
            credential: import.meta.env.VITE_APP_ICE_CREDENTIAL || '',
            routeType: 'any' as const,
            urls,
            username: import.meta.env.VITE_APP_ICE_USERNAME || '',
        }],
    };
}

/**
 * The base package's deprecated hook waits for a global ConnectionStatus atom.
 * Sessions create the same Peer2Peer transport directly so embedded/full-screen
 * clients do not need a component that probes media devices or a CORS-bound API.
 */
function useGamePeer<T extends PeerEvent>({
    code,
    disabled,
    onClose,
    onConnect,
    onData,
    onError,
    onPeer,
    server,
}: GamePeerOptions<T>) {
    const [ready, setReady] = useState(false);
    const callbackRef = useRef<GamePeerCallbacks<T>>({});
    const peerRef = useRef<Peer2Peer<T> | undefined>(undefined);

    useEffect(() => {
        callbackRef.current = { onClose, onConnect, onData, onError, onPeer };
    }, [onClose, onConnect, onData, onError, onPeer]);

    useEffect(() => {
        if (disabled || !code) {
            return;
        }

        const nextPeer = new Peer2Peer<T>(
            code,
            peerConnectionConfig.host,
            peerConnectionConfig.secure,
            peerConnectionConfig.key,
            peerConnectionConfig.port,
            getIceConfiguration(),
            false,
            server,
        );
        peerRef.current = nextPeer;
        callbackRef.current.onPeer?.(nextPeer);

        const handleStatus = (status: 'connecting' | 'ready' | 'failed') => setReady(status === 'ready');
        const handleData = (data: T, connection: Connection<T>) => callbackRef.current.onData?.(data, connection);
        const handleConnect = (connection: Connection<T>) => callbackRef.current.onConnect?.(connection);
        const handleClose = (connection: Connection<T>) => callbackRef.current.onClose?.(connection);
        const handleError = (error: PeerErrorType) => callbackRef.current.onError?.(error);

        nextPeer.on('status', handleStatus);
        nextPeer.on('data', handleData);
        nextPeer.on('connect', handleConnect);
        nextPeer.on('close', handleClose);
        nextPeer.on('error', handleError);

        return () => {
            nextPeer.off('status', handleStatus);
            nextPeer.off('data', handleData);
            nextPeer.off('connect', handleConnect);
            nextPeer.off('close', handleClose);
            nextPeer.off('error', handleError);
            nextPeer.destroy();
            if (peerRef.current === nextPeer) peerRef.current = undefined;
            callbackRef.current.onPeer?.(undefined);
        };
    }, [code, disabled, server]);

    const send = useCallback((data: T) => {
        peerRef.current?.sendAll(data);
    }, []);

    return { ready, send };
}

type HostSessionOptions = {
    code: string;
    hostProfile: UserProfile;
    onRecordingCancel: () => void;
    onRecording: (recordingDataUrl: string) => void;
    onRecordingStart: () => void;
    onRetry: () => void;
    setup: SavedGameSetup;
};

function isValidPlayer(value: unknown): value is GameJoinEvent {
    if (!value || typeof value !== 'object') return false;
    const event = value as Record<string, unknown>;
    if (event.event !== 'game:join' || !event.player || typeof event.player !== 'object') return false;
    const player = event.player as Record<string, unknown>;
    return typeof player.id === 'string'
        && player.id.length > 0
        && player.id.length <= 80
        && typeof player.name === 'string'
        && player.name.trim().length > 0
        && player.name.length <= 40
        && typeof player.avatar === 'string'
        && avatarOptions.includes(player.avatar as UserProfile['avatar']);
}

export function useHostGameSession({
    code,
    hostProfile,
    onRecording,
    onRecordingCancel,
    onRecordingStart,
    onRetry,
    setup,
}: HostSessionOptions) {
    const [snapshot, setSnapshotState] = useState(() => createGameSnapshot(code, setup, hostProfile));
    const snapshotRef = useRef(snapshot);
    const peerRef = useRef<Peer2Peer<GameProtocol> | undefined>(undefined);
    const authorizationRef = useRef(new Map<string, AuthorizedPlayer>());
    const callbackRef = useRef({ onRecording, onRecordingCancel, onRecordingStart, onRetry });
    useEffect(() => {
        callbackRef.current = { onRecording, onRecordingCancel, onRecordingStart, onRetry };
    }, [onRecording, onRecordingCancel, onRecordingStart, onRetry]);

    const publish = useCallback((next: GameSnapshot) => {
        peerRef.current?.sendAll({ event: 'game:snapshot', setup, snapshot: next });
    }, [setup]);

    const setSnapshot = useCallback((updater: SnapshotUpdater) => {
        const next = typeof updater === 'function' ? updater(snapshotRef.current) : updater;
        snapshotRef.current = next;
        setSnapshotState(next);
        publish(next);
    }, [publish]);

    const handleData = useCallback((data: GameProtocol, connection: Connection<GameProtocol>) => {
        if (isValidPlayer(data)) {
            const existingAuthorization = authorizationRef.current.get(connection.connectionId);
            if (existingAuthorization) {
                connection.send({
                    event: 'game:welcome',
                    playerId: existingAuthorization.playerId,
                    setup,
                    snapshot: snapshotRef.current,
                    token: existingAuthorization.token,
                });
                return;
            }
            const normalizedId = data.player.id === 'host' ? `student-${data.player.id}` : data.player.id;
            const idInUse = snapshotRef.current.players.some(({ connected, id }) => connected && id === normalizedId);
            const requestedId = idInUse ? `student-${randomId()}` : normalizedId;
            const authorization = {
                connectionId: connection.connectionId,
                playerId: requestedId,
                token: randomId(),
            };
            authorizationRef.current.set(connection.connectionId, authorization);
            const next = addGameParticipant(snapshotRef.current, {
                avatar: data.player.avatar,
                connected: true,
                id: requestedId,
                name: data.player.name.trim(),
                role: 'student',
            });
            snapshotRef.current = next;
            setSnapshotState(next);
            connection.send({
                event: 'game:welcome',
                playerId: requestedId,
                setup,
                snapshot: next,
                token: authorization.token,
            });
            publish(next);
            return;
        }

        if (data.event === 'game:recording') {
            const authorization = authorizationRef.current.get(connection.connectionId);
            if (
                isValidRecordingAction(data)
                && isAuthorizedPlayerAction(data as GameRecordingEvent, connection, authorization, snapshotRef.current)
                && snapshotRef.current.phase === 'recording'
            ) callbackRef.current.onRecording(data.recordingDataUrl);
            return;
        }

        if (data.event === 'game:record-start') {
            const authorization = authorizationRef.current.get(connection.connectionId);
            if (
                isAuthorizedPlayerAction(data as GameRecordStartEvent, connection, authorization, snapshotRef.current)
                && snapshotRef.current.phase === 'ready'
            ) callbackRef.current.onRecordingStart();
            return;
        }

        if (data.event === 'game:record-cancel') {
            const authorization = authorizationRef.current.get(connection.connectionId);
            if (
                isAuthorizedPlayerAction(data as GameRecordCancelEvent, connection, authorization, snapshotRef.current)
                && snapshotRef.current.phase === 'recording'
            ) callbackRef.current.onRecordingCancel();
            return;
        }

        if (data.event === 'game:retry') {
            const authorization = authorizationRef.current.get(connection.connectionId);
            if (
                isAuthorizedPlayerAction(data as GameRetryEvent, connection, authorization, snapshotRef.current)
                && snapshotRef.current.phase === 'result'
            ) callbackRef.current.onRetry();
        }
    }, [publish, setup]);

    const handleClose = useCallback((connection?: Connection<GameProtocol>) => {
        if (!connection) return;
        const authorization = authorizationRef.current.get(connection.connectionId);
        authorizationRef.current.delete(connection.connectionId);
        if (!authorization) return;
        setSnapshot((current) => disconnectGameParticipant(current, authorization.playerId, setup.rounds.length));
    }, [setSnapshot, setup.rounds.length]);

    const handlePeer = useCallback((peer?: Peer2Peer<GameProtocol>) => {
        peerRef.current = peer;
    }, []);

    const { ready } = useGamePeer<GameProtocol>({
        code: gamePeerCode(code),
        disabled: typeof RTCPeerConnection === 'undefined',
        onClose: handleClose,
        onData: handleData,
        onPeer: handlePeer,
    });

    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);

    return { ready, setSnapshot, snapshot };
}

type StudentSessionOptions = {
    code: string;
    player: UserProfile;
};

function readPlayerId() {
    const key = 'soundmimic-player-id';
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const next = randomId();
    window.sessionStorage.setItem(key, next);
    return next;
}

export function useStudentGameSession({ code, player }: StudentSessionOptions) {
    const [playerId, setPlayerId] = useState(readPlayerId);
    const [setup, setSetup] = useState<SavedGameSetup>();
    const [snapshot, setSnapshot] = useState<GameSnapshot>();
    const [token, setToken] = useState('');
    const [connected, setConnected] = useState(false);
    const snapshotRef = useRef<GameSnapshot | undefined>(undefined);

    const handleData = useCallback((data: GameProtocol) => {
        if (data.event === 'game:welcome') {
            setConnected(true);
            setPlayerId(data.playerId);
            setToken(data.token);
            setSetup(data.setup);
            setSnapshot(data.snapshot);
            snapshotRef.current = data.snapshot;
            return;
        }
        if (data.event === 'game:snapshot') {
            if (!snapshotRef.current || data.snapshot.revision >= snapshotRef.current.revision) {
                setSetup(data.setup);
                setSnapshot(data.snapshot);
                snapshotRef.current = data.snapshot;
            }
        }
    }, []);

    const handleConnect = useCallback((connection: Connection<GameProtocol>) => {
        connection.send({ event: 'game:join', player: { ...player, id: playerId } });
    }, [player, playerId]);

    const handleClose = useCallback(() => {
        setConnected(false);
    }, []);

    const { ready, send } = useGamePeer<GameProtocol>({
        code: gameClientCode(playerId),
        disabled: typeof RTCPeerConnection === 'undefined',
        onClose: handleClose,
        onConnect: handleConnect,
        onData: handleData,
        server: gamePeerCode(code),
    });

    const sendRecording = useCallback((recordingDataUrl: string) => {
        if (!token) return;
        send?.({ event: 'game:recording', playerId, recordingDataUrl, token });
    }, [playerId, send, token]);

    const requestRecordingStart = useCallback(() => {
        if (!token) return;
        send?.({ event: 'game:record-start', playerId, token });
    }, [playerId, send, token]);

    const cancelRecording = useCallback(() => {
        if (!token) return;
        send?.({ event: 'game:record-cancel', error: 'microphone', playerId, token });
    }, [playerId, send, token]);

    const requestRetry = useCallback(() => {
        if (!token) return;
        send?.({ event: 'game:retry', playerId, token });
    }, [playerId, send, token]);

    return {
        cancelRecording,
        connected,
        playerId,
        ready,
        requestRecordingStart,
        requestRetry,
        sendRecording,
        setup,
        snapshot,
    };
}
