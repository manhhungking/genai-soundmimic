import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/Avatar';
import type { PlayerScore } from './model';

type ScoreboardProps = {
    activePlayerId?: string;
    scores: PlayerScore[];
};

/** Top-right leaderboard: every connected player's running total, highest first. */
export default function Scoreboard({ activePlayerId, scores }: ScoreboardProps) {
    const { t } = useTranslation();
    if (!scores.length) return null;

    return (
        <aside aria-label={t('play.scoreboard')} className="play-scoreboard">
            <header>
                <EmojiEventsRounded aria-hidden="true" />
                <span>{t('play.scoreboard')}</span>
            </header>
            <ol>
                {scores.map(({ player, total }, index) => (
                    <li
                        className={player.id === activePlayerId ? 'is-active' : ''}
                        key={player.id}
                    >
                        <span className="play-scoreboard__rank">{index + 1}</span>
                        <Avatar
                            name={player.name}
                            size="small"
                            variant={player.avatar}
                        />
                        <strong>{player.name}</strong>
                        <span className="play-scoreboard__score">{total}</span>
                    </li>
                ))}
            </ol>
        </aside>
    );
}
