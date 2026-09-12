import BarChartRounded from '@mui/icons-material/BarChartRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

type GameControlsProps = {
    xaiEnabled: boolean;
    onToggleXai: () => void;
};

export default function GameControls({ xaiEnabled, onToggleXai }: GameControlsProps) {
    const { t } = useTranslation();
    const [paused, setPaused] = useState(false);
    const { pathname } = useLocation();

    return (
        <section
            aria-label={t('game.hostControls')}
            className="game-controls"
        >
            <strong>{t('game.controls')}</strong>
            <button
                aria-label={t(paused ? 'game.resume' : 'game.pause')}
                aria-pressed={paused}
                className={paused ? 'is-active' : ''}
                onClick={() => setPaused((isPaused) => !isPaused)}
                title={t(paused ? 'game.resume' : 'game.pause')}
                type="button"
            >
                {paused ? <PlayArrowRounded /> : <PauseRounded />}
            </button>
            <button
                aria-label={t(xaiEnabled ? 'game.xaiOff' : 'game.xaiOn')}
                aria-pressed={xaiEnabled}
                className={xaiEnabled ? 'is-active game-controls__xai' : 'game-controls__xai'}
                onClick={onToggleXai}
                title={t(xaiEnabled ? 'game.xaiReady' : 'game.xaiNext')}
                type="button"
            >
                <LightbulbRounded />
            </button>
            <Link
                aria-label={t('game.openResults')}
                className={pathname === '/results' ? 'is-active' : ''}
                title={t('game.sessionResults')}
                to="/results"
            >
                <BarChartRounded />
            </Link>
        </section>
    );
}
