import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import EqualizerRounded from '@mui/icons-material/EqualizerRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PsychologyRounded from '@mui/icons-material/PsychologyRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import Avatar from '../components/Avatar';
import type { AppOutletContext } from '../components/AppLayout';
import { roundResults } from '../data/results';
import RoundXaiPanel from '../features/results/RoundXaiPanel';
import { getSoundNameKey } from '../util/soundNames';

const overview = [
    { labelKey: 'results.completed', value: '1', icon: <CheckCircleRounded /> },
    { labelKey: 'results.studentTurns', value: '4', icon: <GroupsRounded /> },
    { labelKey: 'results.averageConfidence', value: '75%', icon: <EqualizerRounded /> },
    { labelKey: 'results.soundGuesses', value: '4', icon: <VolumeUpRounded /> },
] as const;

export function Component() {
    const { t } = useTranslation();
    const { xaiEnabled } = useOutletContext<AppOutletContext>();

    return (
        <div className="results-view">
            <header className="results-header">
                <div>
                    <h1>{t('results.title')}</h1>
                    <p>{t('results.description')}</p>
                </div>
                <span className="results-header__status">
                    <CheckCircleRounded /> {t('results.roundComplete', { round: 1 })}
                </span>
            </header>

            <dl
                aria-label={t('results.summary')}
                className="results-overview"
            >
                {overview.map((item) => (
                    <div key={item.labelKey}>
                        <span>{item.icon}</span>
                        <dt>{t(item.labelKey)}</dt>
                        <dd>{item.value}</dd>
                    </div>
                ))}
            </dl>

            {roundResults.map((round) => (
                <section
                    className="round-results"
                    key={round.id}
                >
                    <header className="round-results__header">
                        <span>{round.id}</span>
                        <div>
                            <h2>{t('results.round', { round: round.id })}</h2>
                            <p>{t('sound.everyday')}</p>
                        </div>
                    </header>

                    <div
                        aria-label={t('results.predictionsAria', { round: round.id })}
                        className="results-table"
                        role="table"
                    >
                        <div
                            className="results-table__header"
                            role="row"
                        >
                            <span role="columnheader">{t('results.turn')}</span>
                            <span role="columnheader">{t('results.learner')}</span>
                            <span role="columnheader">{t('results.prediction')}</span>
                            <span role="columnheader">{t('play.confidence')}</span>
                        </div>
                        {round.predictions.map((prediction, index) => {
                            const soundNameKey = getSoundNameKey(prediction.prediction);
                            return (
                                <div
                                    className="results-table__row"
                                    key={prediction.name}
                                    role="row"
                                >
                                    <span
                                        className="results-table__turn"
                                        role="cell"
                                    >
                                        {index + 1}
                                    </span>
                                    <span
                                        className="results-table__learner"
                                        role="cell"
                                    >
                                        <Avatar
                                            name={prediction.name}
                                            size="small"
                                            variant={prediction.avatar}
                                        />
                                        <strong>{prediction.name}</strong>
                                    </span>
                                    <span
                                        className="results-table__prediction"
                                        role="cell"
                                    >
                                        <i aria-hidden="true">{prediction.emoji}</i>
                                        <strong>{soundNameKey ? t(soundNameKey) : prediction.prediction}</strong>
                                    </span>
                                    <span
                                        className="results-table__confidence"
                                        role="cell"
                                    >
                                        <span>
                                            <i style={{ width: `${prediction.confidence}%` }} />
                                        </span>
                                        <strong>{prediction.confidence}%</strong>
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {xaiEnabled && <RoundXaiPanel round={round} />}
                </section>
            ))}

            <aside className="results-reflection">
                <PsychologyRounded />
                <div>
                    <strong>{t('results.reflectTitle')}</strong>
                    <p>{t('results.reflectDescription')}</p>
                </div>
            </aside>
        </div>
    );
}
