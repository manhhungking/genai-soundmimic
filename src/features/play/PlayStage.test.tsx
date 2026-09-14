import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { i18nReady } from '../../i18n';
import { defaultHostProfile } from '../../data/profile';
import { defaultGameSetup } from '../setup/model';
import { addGameParticipant, createGameSnapshot, setGamePhase } from './model';
import PlayStage from './PlayStage';

const callbacks = {
    onAdvance: vi.fn(),
    onBegin: vi.fn(),
    onResumeAudio: vi.fn(),
    onResumeReference: vi.fn(),
    onReveal: vi.fn(),
    onRetry: vi.fn(),
    onStartRecording: vi.fn(),
    onStopRecording: vi.fn(),
};

function readySnapshot() {
    const setup = { ...defaultGameSetup, hostParticipates: false };
    const snapshot = addGameParticipant(createGameSnapshot('session', setup, defaultHostProfile), {
        avatar: 'maya',
        connected: true,
        id: 'student-1',
        name: 'Maya',
        role: 'student',
    });
    return { setup, snapshot: setGamePhase(snapshot, 'ready') };
}

describe('PlayStage permissions and XAI', () => {
    beforeAll(async () => {
        await i18nReady;
        await i18n.changeLanguage('en-GB');
    });

    it('shows recording controls only to the active player', () => {
        const { setup, snapshot } = readySnapshot();
        const view = render(
            <PlayStage
                {...callbacks}
                audioBlocked={false}
                audioLevel={{ current: 0 }}
                connectionReady
                elapsedSeconds={0}
                isHost={false}
                recording={false}
                recordingDuration={3}
                referenceBlocked={false}
                setup={setup}
                snapshot={snapshot}
                viewerPlayerId="student-1"
            />,
        );

        expect(screen.getByRole('button', { name: /Record your sound/ })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /Sound Mimic game stage/i })).toHaveClass(
            'phase-ready',
            'has-active-performer',
        );
        expect(document.querySelector('.play-stage__turn-bubble')).toHaveClass('is-on-stage');
        expect(screen.queryByLabelText('Turn order')).not.toBeInTheDocument();

        view.rerender(
            <PlayStage
                {...callbacks}
                audioBlocked={false}
                audioLevel={{ current: 0 }}
                connectionReady
                elapsedSeconds={0}
                isHost={false}
                recording={false}
                recordingDuration={3}
                referenceBlocked={false}
                setup={setup}
                snapshot={snapshot}
                viewerPlayerId="student-2"
            />,
        );

        expect(screen.queryByRole('button', { name: /Record your sound/ })).not.toBeInTheDocument();
        expect(screen.getByText('Waiting for Maya to record')).toBeInTheDocument();
    });

    it('keeps the waiting state compact without dashboard cards', () => {
        const { setup, snapshot } = readySnapshot();
        const waitingSnapshot = setGamePhase(snapshot, 'waiting');

        render(
            <PlayStage
                {...callbacks}
                audioBlocked={false}
                audioLevel={{ current: 0 }}
                connectionReady
                elapsedSeconds={0}
                isHost
                recording={false}
                recordingDuration={3}
                referenceBlocked={false}
                setup={setup}
                snapshot={waitingSnapshot}
                viewerPlayerId="host"
            />,
        );

        expect(screen.getByRole('region', { name: /Sound Mimic game stage/i })).toHaveClass('phase-waiting');
        expect(document.querySelector('.play-stage__turn-bubble')).toHaveClass('is-waiting');
        expect(document.querySelector('.play-stage__action-bar')).toBeInTheDocument();
        expect(document.querySelector('.play-stage__controls')).not.toBeInTheDocument();
        expect(document.querySelector('.play-stage__queue')).not.toBeInTheDocument();
    });

    it('renders the host-controlled explanation inside the stage', () => {
        const { setup, snapshot } = readySnapshot();
        const resultSnapshot = setGamePhase(snapshot, 'result', {
            predictions: [
                { className: 'Bird', probability: 0.82 },
                { className: 'Clap', probability: 0.18 },
            ],
            resultRevealed: true,
            xaiEnabled: true,
        });

        render(
            <PlayStage
                {...callbacks}
                audioBlocked={false}
                audioLevel={{ current: 0 }}
                connectionReady
                elapsedSeconds={0}
                isHost={false}
                recording={false}
                recordingDuration={3}
                referenceBlocked={false}
                setup={setup}
                snapshot={resultSnapshot}
                viewerPlayerId="student-1"
            />,
        );

        expect(screen.getByLabelText('AI explanation')).toBeInTheDocument();
        expect(screen.getByText('Why Bird?')).toBeInTheDocument();
        expect(screen.getAllByText('82%')).toHaveLength(2);
    });
});
