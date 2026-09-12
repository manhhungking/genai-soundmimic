import BarChartRounded from '@mui/icons-material/BarChartRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';

type GameControlsProps = {
    xaiEnabled: boolean;
    onToggleXai: () => void;
};

export default function GameControls({ xaiEnabled, onToggleXai }: GameControlsProps) {
    const [paused, setPaused] = useState(false);
    const { pathname } = useLocation();

    return (
        <section
            aria-label="Host game controls"
            className="game-controls"
        >
            <strong>Game controls</strong>
            <button
                aria-label={paused ? 'Resume game' : 'Pause game'}
                aria-pressed={paused}
                className={paused ? 'is-active' : ''}
                onClick={() => setPaused((isPaused) => !isPaused)}
                title={paused ? 'Resume game' : 'Pause game'}
                type="button"
            >
                {paused ? <PlayArrowRounded /> : <PauseRounded />}
            </button>
            <button
                aria-label={xaiEnabled ? 'Turn off XAI explanations' : 'Turn on XAI explanations'}
                aria-pressed={xaiEnabled}
                className={xaiEnabled ? 'is-active game-controls__xai' : 'game-controls__xai'}
                onClick={onToggleXai}
                title={xaiEnabled ? 'XAI is on for the next round' : 'Turn on XAI for the next round'}
                type="button"
            >
                <LightbulbRounded />
            </button>
            <Link
                aria-label="Open session results"
                className={pathname === '/results' ? 'is-active' : ''}
                title="Session results"
                to="/results"
            >
                <BarChartRounded />
            </Link>
        </section>
    );
}
