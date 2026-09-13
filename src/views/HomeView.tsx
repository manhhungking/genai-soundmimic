import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import AppHero from '../components/AppHero';

type Feature = {
    titleKey: 'nav.train' | 'nav.play' | 'nav.results';
    descriptionKey: 'home.trainDescription' | 'home.playDescription' | 'home.resultsDescription';
    icon: ReactNode;
    tone: string;
    to: string;
};

const features: Feature[] = [
    {
        titleKey: 'nav.train',
        descriptionKey: 'home.trainDescription',
        icon: <GraphicEqRounded />,
        tone: 'blue',
        to: '/train',
    },
    {
        titleKey: 'nav.play',
        descriptionKey: 'home.playDescription',
        icon: <PlayArrowRounded />,
        tone: 'teal',
        to: '/play',
    },
    {
        titleKey: 'nav.results',
        descriptionKey: 'home.resultsDescription',
        icon: <BarChartRounded />,
        tone: 'blue',
        to: '/results',
    },
];

const steps = [
    ['home.stepTrain', 'home.stepTrainDescription'],
    ['home.stepPlay', 'home.stepPlayDescription'],
    ['home.stepReflect', 'home.stepReflectDescription'],
] as const;

export function Component() {
    const { t } = useTranslation();

    return (
        <div className="view-page home-view">
            <AppHero
                title={t('home.title')}
                description={t('home.description')}
                slogan={t('home.slogan')}
                bubble={t('home.bubble')}
            />

            <section
                className="feature-grid"
                aria-label={t('home.chooseActivity')}
            >
                {features.map((feature) => (
                    <Link
                        className="feature-card"
                        key={feature.titleKey}
                        to={feature.to}
                    >
                        <span className={`feature-card__icon feature-card__icon--${feature.tone}`}>{feature.icon}</span>
                        <h2>{t(feature.titleKey)}</h2>
                        <p>{t(feature.descriptionKey)}</p>
                        <span className="feature-card__arrow">
                            <ArrowForwardRounded />
                        </span>
                    </Link>
                ))}
            </section>

            <section className="how-it-works">
                <h2>{t('home.howItWorks')}</h2>
                <ol>
                    {steps.map(([title, description], index) => (
                        <li key={title}>
                            <span>{index + 1}</span>
                            <div>
                                <strong>{t(title)}</strong>
                                <p>{t(description)}</p>
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
                        <h2>{t('home.todayTitle')}</h2>
                        <p>{t('home.todayDescription')}</p>
                    </div>
                </div>
                <ol>
                    <li>
                        <span>1</span> {t('home.todayOne')}
                    </li>
                    <li>
                        <span>2</span> {t('home.todayTwo')}
                    </li>
                    <li>
                        <span>3</span> {t('home.todayThree')}
                    </li>
                </ol>
            </section>
        </div>
    );
}
