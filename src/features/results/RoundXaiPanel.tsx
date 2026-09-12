import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BiotechRounded from '@mui/icons-material/BiotechRounded';
import DataUsageRounded from '@mui/icons-material/DataUsageRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { useTranslation } from 'react-i18next';
import Spectrogram from '../../components/Spectrogram';
import type { RoundResult } from '../../data/results';
import { getSoundNameKey } from '../../locales/sounds';

type RoundXaiPanelProps = {
    round: RoundResult;
};

const similarSounds = ['xai.similarOne', 'xai.similarTwo', 'xai.similarThree'] as const;

export default function RoundXaiPanel({ round }: RoundXaiPanelProps) {
    const { t } = useTranslation();
    const leadingPrediction = round.predictions[0];
    const predictionKey = getSoundNameKey(leadingPrediction.prediction);
    const translatedPrediction = predictionKey ? t(predictionKey) : leadingPrediction.prediction;

    return (
        <section
            aria-label={t('xai.aria', { round: round.id })}
            className="round-xai"
        >
            <header className="round-xai__header">
                <span>
                    <AutoAwesomeRounded />
                </span>
                <div>
                    <h3>{t('xai.title', { prediction: translatedPrediction })}</h3>
                    <p>{t('xai.description', { name: leadingPrediction.name })}</p>
                </div>
            </header>

            <div className="round-xai__grid">
                <article>
                    <h4>
                        <SearchRounded /> {t('xai.heard')}
                    </h4>
                    <Spectrogram />
                    <p>{t('xai.pattern')}</p>
                </article>

                <article>
                    <h4>
                        <DataUsageRounded /> {t('xai.closest')}
                    </h4>
                    <ul className="round-xai__matches">
                        {similarSounds.map((description, index) => (
                            <li key={description}>
                                <span aria-hidden="true">{index === 0 ? '🐦' : index === 1 ? '🐤' : '🐧'}</span>
                                <div>
                                    <strong>{t('sound.bird')}</strong>
                                    <small>{t(description)}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>

                <article>
                    <h4>
                        <BiotechRounded /> {t('xai.whatIf')}
                    </h4>
                    <div className="round-xai__change">
                        <span>{t('xai.original')}</span>
                        <strong>🐦 {t('sound.bird')}</strong>
                        <b>{leadingPrediction.confidence}%</b>
                    </div>
                    <span className="round-xai__arrow">↓</span>
                    <div className="round-xai__change">
                        <span>{t('xai.withoutChirp')}</span>
                        <strong>🐱 {t('sound.cat')}</strong>
                        <b>22%</b>
                    </div>
                    <p>{t('xai.change')}</p>
                </article>
            </div>
        </section>
    );
}
