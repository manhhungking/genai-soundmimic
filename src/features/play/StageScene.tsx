import { useEffect, useRef, type MutableRefObject } from 'react';
import Avatar from '../../components/Avatar';
import type { GameParticipant, GamePhase } from './model';

type StageSceneProps = {
    activePlayerId?: string;
    audioLevel: MutableRefObject<number>;
    phase: GamePhase;
    players: GameParticipant[];
};

// The performer only steps out of the lineup once recording has actually finished and it's
// their turn to play a clip back — see PlayStage's matching roundStageKey/performerPhases.
const onStagePhases = new Set<GamePhase>(['entering', 'performing', 'result']);

/**
 * The stage's cast — each connected player's own painted avatar art, not a 3D model. A
 * procedurally-built 3D rig could never match the character sheets' illustration style, so
 * the live stage uses the same portrait art as the avatar picker instead: everyone stands in
 * a lineup, and the current performer steps forward with a highlighted ring while their clip
 * plays back.
 */
export default function StageScene({ activePlayerId, audioLevel, phase, players }: StageSceneProps) {
    const activeRef = useRef<HTMLDivElement>(null);
    const connectedPlayers = players.filter(({ connected }) => connected);
    const performing = phase === 'performing';

    useEffect(() => {
        if (!performing) return;
        let frame = 0;
        const tick = () => {
            activeRef.current?.style.setProperty('--sing-level', Math.min(1, audioLevel.current).toFixed(3));
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [audioLevel, performing]);

    return (
        <div aria-hidden="true" className="play-stage__cast">
            {connectedPlayers.map((player) => {
                const active = onStagePhases.has(phase) && player.id === activePlayerId;
                return (
                    <div
                        className={`play-stage__cast-member${active ? ' is-active' : ''}${
                            active && performing ? ' is-performing' : ''}`}
                        key={player.id}
                        ref={active ? activeRef : undefined}
                    >
                        {active && <span className="play-stage__cast-mic">🎤</span>}
                        <Avatar name={player.name} size={active ? 'large' : 'medium'} variant={player.avatar} />
                        <span>{player.name}</span>
                    </div>
                );
            })}
        </div>
    );
}
