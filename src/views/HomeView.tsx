import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import FiberManualRecordRounded from '@mui/icons-material/FiberManualRecordRounded';
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import AppHero from '../components/AppHero';
import Waveform from '../components/Waveform';

type JourneyStep = {
    actionKey: 'train.trainClassifier' | 'setup.startGame' | 'game.openResults';
    titleKey: 'nav.train' | 'nav.play' | 'nav.results';
    descriptionKey: 'home.trainDescription' | 'home.playDescription' | 'home.resultsDescription';
    icon: ReactNode;
    tone: 'blue' | 'teal' | 'violet';
    to: string;
};

const journeySteps: JourneyStep[] = [
    {
        actionKey: 'train.trainClassifier',
        titleKey: 'nav.train',
        descriptionKey: 'home.trainDescription',
        icon: <GraphicEqRounded />,
        tone: 'blue',
        to: '/train',
    },
    {
        actionKey: 'setup.startGame',
        titleKey: 'nav.play',
        descriptionKey: 'home.playDescription',
        icon: <PlayArrowRounded />,
        tone: 'teal',
        to: '/play',
    },
    {
        actionKey: 'game.openResults',
        titleKey: 'nav.results',
        descriptionKey: 'home.resultsDescription',
        icon: <BarChartRounded />,
        tone: 'violet',
        to: '/results',
    },
];

function SoundExample({ icon, label, tone }: { icon: string; label: string; tone: 'blue' | 'teal' }) {
    return (
        <div className={`home-demo-sound home-demo-sound--${tone}`}>
            <span className="home-demo-sound__icon" aria-hidden="true">{icon}</span>
            <strong>{label}</strong>
            <span className="home-demo-waveform" aria-hidden="true"><Waveform compact /></span>
            <span className="home-demo-sound__record" aria-hidden="true"><FiberManualRecordRounded /></span>
            <span className="home-demo-sound__play" aria-hidden="true"><PlayArrowRounded /></span>
        </div>
    );
}

function TrainingExample({ icon, label, tone }: { icon: string; label: string; tone: 'blue' | 'teal' }) {
    const { t } = useTranslation();

    return (
        <div className={`home-training-row home-training-row--${tone}`}>
            <span aria-hidden="true">{icon}</span>
            <strong>{label}</strong>
            <span className="home-demo-waveform" aria-hidden="true"><Waveform compact /></span>
            <small>{t('train.sampleCount', { count: 2 })}</small>
        </div>
    );
}

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

            <section className="home-guide" aria-labelledby="home-guide-title">
                <header className="home-guide__heading">
                    <h2 id="home-guide-title">{t('home.guideTitle')}</h2>
                </header>

                <ol className="home-guide__steps">
                    <li className="home-guide__step home-guide__step--blue">
                        <span className="home-guide__number">1</span>
                        <article className="home-guide-card">
                            <header>
                                <h3>{t('home.teachTitle')}</h3>
                                <p>{t('home.teachDescription')}</p>
                            </header>
                            <div className="home-guide-demo home-guide-demo--sounds">
                                <SoundExample icon="🐦" label={t('sound.bird')} tone="blue" />
                                <SoundExample icon="👏" label={t('sound.clap')} tone="teal" />
                                <div className="home-demo-add">
                                    <MicRounded />
                                    <span>{t('home.recordSamples')}</span>
                                </div>
                            </div>
                        </article>
                        <ArrowForwardRounded className="home-guide__connector" aria-hidden="true" />
                    </li>

                    <li className="home-guide__step home-guide__step--teal">
                        <span className="home-guide__number">2</span>
                        <article className="home-guide-card">
                            <header>
                                <h3>{t('home.trainTitle')}</h3>
                                <p>{t('home.trainGuideDescription')}</p>
                            </header>
                            <div className="home-guide-demo home-guide-demo--training">
                                <strong className="home-training-title">{t('train.training')}</strong>
                                <TrainingExample icon="🐦" label={t('sound.bird')} tone="blue" />
                                <TrainingExample icon="👏" label={t('sound.clap')} tone="teal" />
                                <div className="home-training-button">{t('train.trainClassifier')}</div>
                                <div className="home-training-complete">
                                    <CheckCircleRounded />
                                    <span>{t('home.modelTrained')}</span>
                                </div>
                            </div>
                        </article>
                        <ArrowForwardRounded className="home-guide__connector" aria-hidden="true" />
                    </li>

                    <li className="home-guide__step home-guide__step--violet">
                        <span className="home-guide__number">3</span>
                        <article className="home-guide-card">
                            <header>
                                <h3>{t('home.playReflectTitle')}</h3>
                                <p>{t('home.playReflectDescription')}</p>
                            </header>
                            <div className="home-guide-demo home-guide-demo--result">
                                <div className="home-result-listening">
                                    <span className="home-result-mic" aria-hidden="true"><MicRounded /></span>
                                    <span className="home-result-wave" aria-hidden="true"><Waveform compact /></span>
                                </div>
                                <div className="home-result-guess">
                                    <span aria-hidden="true">🐦</span>
                                    <strong>{t('home.exampleGuess', { label: t('sound.bird') })}</strong>
                                </div>
                                <div className="home-result-reflect">
                                    <BarChartRounded />
                                    <span>{t('home.reflectPrompt')}</span>
                                </div>
                            </div>
                        </article>
                    </li>
                </ol>

                <aside className="home-guide__tip" aria-label={t('home.quickTips')}>
                    <span className="home-guide__tip-icon"><LightbulbRounded /></span>
                    <div>
                        <span><CheckCircleRounded />{t('home.trySounds')}</span>
                        <span><CheckCircleRounded />{t('home.sampleRequirement')}</span>
                    </div>
                    <strong>{t('home.moreExamples')}</strong>
                </aside>
            </section>

            <section className="home-journey" aria-labelledby="home-journey-title">
                <header className="home-journey__heading">
                    <h2 id="home-journey-title">{t('home.chooseActivity')}</h2>
                </header>

                <ol className="home-journey__steps">
                    {journeySteps.map((step, index) => (
                        <li className={`home-journey__item home-journey__item--${step.tone}`} key={step.titleKey}>
                            <Link className="home-journey__step" to={step.to}>
                                <span className="home-journey__number">{index + 1}</span>
                                <span className="home-journey__icon">{step.icon}</span>
                                <span className="home-journey__copy">
                                    <strong>{t(step.titleKey)}</strong>
                                    <span>{t(step.descriptionKey)}</span>
                                </span>
                                <span className="home-journey__action">
                                    {t(step.actionKey)}
                                    <ArrowForwardRounded />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}
