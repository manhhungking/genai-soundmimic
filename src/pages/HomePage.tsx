import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import AppHero from '../components/AppHero';

type Feature = {
    title: string;
    description: string;
    icon: ReactNode;
    tone: string;
    to: string;
};

const features: Feature[] = [
    {
        title: 'Train Model',
        description: 'Record and label sound examples.',
        icon: <GraphicEqRounded />,
        tone: 'blue',
        to: '/train',
    },
    {
        title: 'Play',
        description: 'Take turns and hear the AI guess.',
        icon: <PlayArrowRounded />,
        tone: 'teal',
        to: '/play',
    },
    {
        title: 'Results',
        description: 'Review guesses and reflect together.',
        icon: <BarChartRounded />,
        tone: 'blue',
        to: '/results',
    },
];

const steps = [
    ['Train', 'Record and label sounds.'],
    ['Play', 'Take turns at the mic.'],
    ['Reflect', 'Review the AI guesses together.'],
];

export function Component() {
    return (
        <div className="view-page home-view">
            <AppHero
                title="Welcome!"
                description={
                    <>
                        Train sounds. Play together.
                        <br />
                        Review what the AI guessed.
                    </>
                }
                slogan={
                    <>
                        Start with training, then play,
                        <br />
                        then talk about what happened.
                    </>
                }
                bubble="Ready to explore?"
            />

            <section
                className="feature-grid"
                aria-label="Choose an activity"
            >
                {features.map((feature) => (
                    <Link
                        className="feature-card"
                        key={feature.title}
                        to={feature.to}
                    >
                        <span className={`feature-card__icon feature-card__icon--${feature.tone}`}>{feature.icon}</span>
                        <h2>{feature.title}</h2>
                        <p>{feature.description}</p>
                        <span className="feature-card__arrow">
                            <ArrowForwardRounded />
                        </span>
                    </Link>
                ))}
            </section>

            <section className="how-it-works">
                <h2>How it works</h2>
                <ol>
                    {steps.map(([title, description], index) => (
                        <li key={title}>
                            <span>{index + 1}</span>
                            <div>
                                <strong>{title}</strong>
                                <p>{description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="today-strip">
                <div className="today-strip__title">
                    <span>
                        <CalendarMonthRounded />
                    </span>
                    <div>
                        <h2>Today’s sound adventure</h2>
                        <p>A quick guide for your group.</p>
                    </div>
                </div>
                <ol>
                    <li>
                        <span>1</span> Build your sound set
                    </li>
                    <li>
                        <span>2</span> Take turns at the mic
                    </li>
                    <li>
                        <span>3</span> Share what surprised you
                    </li>
                </ol>
            </section>
        </div>
    );
}
