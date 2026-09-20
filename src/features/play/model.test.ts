import type { Connection } from '@genai-fi/base';
import { describe, expect, it } from 'vitest';
import { defaultHostProfile } from '../../data/profile';
import { defaultGameRules, initialSetupRounds, type SavedGameSetup } from '../setup/model';
import {
    addGameParticipant,
    advanceGameTurn,
    beginCurrentTurn,
    completeGameAttempt,
    createGameSnapshot,
    disconnectGameParticipant,
    retryGameTurn,
} from './model';
import { isAuthorizedPlayerAction, isValidRecordingAction, type GameProtocol } from './protocol';

const setup: SavedGameSetup = {
    hostParticipates: true,
    modelMode: 'rotate',
    rounds: initialSetupRounds.slice(0, 2),
    rules: { ...defaultGameRules, attempts: 2 },
    selectedStudent: 0,
    version: 2,
};

describe('play game state', () => {
    it('keeps host participation separate and rotates connected players across rounds', () => {
        let snapshot = createGameSnapshot('session', setup, defaultHostProfile);
        snapshot = addGameParticipant(snapshot, {
            avatar: 'maya', connected: true, id: 'student-1', name: 'Maya', role: 'student',
        });
        expect(snapshot.players.map(({ id }) => id)).toEqual(['host', 'student-1']);

        snapshot = advanceGameTurn(snapshot, setup.rounds.length);
        expect(snapshot.activePlayerId).toBe('student-1');
        expect(snapshot.roundIndex).toBe(0);
        snapshot = advanceGameTurn(snapshot, setup.rounds.length);
        expect(snapshot.activePlayerId).toBe('host');
        expect(snapshot.roundIndex).toBe(1);
    });

    it('keeps a facilitating host out of the queue and advances when the active student disconnects', () => {
        let snapshot = createGameSnapshot('session', { ...setup, hostParticipates: false }, defaultHostProfile);
        expect(snapshot.players).toEqual([]);
        snapshot = addGameParticipant(snapshot, {
            avatar: 'maya', connected: true, id: 'student-1', name: 'Maya', role: 'student',
        });
        snapshot = addGameParticipant(snapshot, {
            avatar: 'leo', connected: true, id: 'student-2', name: 'Leo', role: 'student',
        });
        snapshot = beginCurrentTurn(snapshot, setup);
        snapshot = disconnectGameParticipant(snapshot, 'student-1', setup.rounds.length);

        expect(snapshot.players.find(({ id }) => id === 'student-1')?.connected).toBe(false);
        expect(snapshot.activePlayerId).toBe('student-2');
        expect(snapshot.phase).toBe('exiting');
    });

    it('records real prediction results and only retries within the configured attempt count', () => {
        let snapshot = createGameSnapshot('session', setup, defaultHostProfile);
        snapshot = completeGameAttempt(snapshot, {
            predictions: [{ className: 'Bird', probability: 0.91 }],
            recordingDataUrl: 'data:audio/webm;base64,abc',
        }, setup);
        expect(snapshot.history).toHaveLength(1);
        expect(retryGameTurn(snapshot, setup).attempt).toBe(2);
        const finalAttempt = { ...snapshot, attempt: 2 };
        expect(retryGameTurn(finalAttempt, setup)).toBe(finalAttempt);
    });

    it('goes straight to ready (never entering) when starting or retrying a round without a reference clip', () => {
        // Everyone records simultaneously from where they're already standing — nobody should
        // walk to the mic ("entering") until it's their turn to play a clip back.
        const noReference = { ...setup, rules: { ...setup.rules, playReference: false } };
        let snapshot = createGameSnapshot('session', noReference, defaultHostProfile);
        snapshot = addGameParticipant(snapshot, {
            avatar: 'maya', connected: true, id: 'student-1', name: 'Maya', role: 'student',
        });
        snapshot = beginCurrentTurn(snapshot, noReference);
        expect(snapshot.phase).toBe('ready');

        snapshot = completeGameAttempt(snapshot, {
            predictions: [{ className: 'Bird', probability: 0.5 }],
            recordingDataUrl: 'data:audio/webm;base64,abc',
        }, noReference);
        expect(retryGameTurn(snapshot, noReference).phase).toBe('ready');
    });

    it('accepts student actions only from the authorized active connection', () => {
        const snapshot = addGameParticipant(createGameSnapshot('session', {
            ...setup,
            hostParticipates: false,
        }, defaultHostProfile), {
            avatar: 'maya', connected: true, id: 'student-1', name: 'Maya', role: 'student',
        });
        const connection = { connectionId: 'peer-1' } as Connection<GameProtocol>;
        const event = {
            event: 'game:recording' as const,
            playerId: 'student-1',
            recordingDataUrl: 'data:audio/webm;base64,abc',
            token: 'secret',
        };
        const authorization = { connectionId: 'peer-1', playerId: 'student-1', token: 'secret' };

        expect(isAuthorizedPlayerAction(event, connection, authorization, snapshot)).toBe(true);
        expect(isAuthorizedPlayerAction({ ...event, token: 'wrong' }, connection, authorization, snapshot)).toBe(false);
        expect(isAuthorizedPlayerAction(event, { ...connection, connectionId: 'peer-2' }, authorization, snapshot)).toBe(false);
        expect(isValidRecordingAction(event)).toBe(true);
        expect(isValidRecordingAction({ ...event, recordingDataUrl: 'https://example.test/audio.webm' })).toBe(false);
    });
});
