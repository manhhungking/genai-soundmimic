import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import EqualizerRounded from '@mui/icons-material/EqualizerRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PsychologyRounded from '@mui/icons-material/PsychologyRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { useOutletContext } from 'react-router';
import Avatar from '../components/Avatar';
import type { AppOutletContext } from '../components/AppLayout';
import { roundResults } from '../data/results';
import RoundXaiPanel from '../features/results/RoundXaiPanel';

const overview = [
    { label: 'Round complete', value: '1', icon: <CheckCircleRounded /> },
    { label: 'Student turns', value: '4', icon: <GroupsRounded /> },
    { label: 'Average confidence', value: '75%', icon: <EqualizerRounded /> },
    { label: 'Sound guesses', value: '4', icon: <VolumeUpRounded /> },
];

export function Component() {
    const { xaiEnabled } = useOutletContext<AppOutletContext>();

    return (
        <div className="results-view">
            <header className="results-header">
                <div>
                    <h1>Session Results</h1>
                    <p>Review each AI guess with your group.</p>
                </div>
                <span className="results-header__status">
                    <CheckCircleRounded /> Round 1 complete
                </span>
            </header>

            <dl
                aria-label="Session summary"
                className="results-overview"
            >
                {overview.map((item) => (
                    <div key={item.label}>
                        <span>{item.icon}</span>
                        <dt>{item.label}</dt>
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
                            <h2>Round {round.id}</h2>
                            <p>{round.soundSet}</p>
                        </div>
                    </header>

                    <div
                        aria-label={`AI predictions for Round ${round.id}`}
                        className="results-table"
                        role="table"
                    >
                        <div
                            className="results-table__header"
                            role="row"
                        >
                            <span role="columnheader">Turn</span>
                            <span role="columnheader">Learner</span>
                            <span role="columnheader">AI prediction</span>
                            <span role="columnheader">Confidence</span>
                        </div>
                        {round.predictions.map((prediction, index) => (
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
                                    <strong>{prediction.prediction}</strong>
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
                        ))}
                    </div>

                    {xaiEnabled && <RoundXaiPanel round={round} />}
                </section>
            ))}

            <aside className="results-reflection">
                <PsychologyRounded />
                <div>
                    <strong>Talk about the guesses</strong>
                    <p>Which sounds were easy for the AI? Which ones surprised your group?</p>
                </div>
            </aside>
        </div>
    );
}
