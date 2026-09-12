import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import BiotechRounded from '@mui/icons-material/BiotechRounded';
import DataUsageRounded from '@mui/icons-material/DataUsageRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import Spectrogram from '../../components/Spectrogram';
import type { RoundResult } from '../../data/results';

type RoundXaiPanelProps = {
    round: RoundResult;
};

const similarSounds = ['A quick, high chirp', 'A short, bright call', 'A repeating little tweet'];

export default function RoundXaiPanel({ round }: RoundXaiPanelProps) {
    const leadingPrediction = round.predictions[0];

    return (
        <section
            aria-label={`XAI results for Round ${round.id}`}
            className="round-xai"
        >
            <header className="round-xai__header">
                <span>
                    <AutoAwesomeRounded />
                </span>
                <div>
                    <h3>Why did the AI guess {leadingPrediction.prediction}?</h3>
                    <p>A closer look at the sound pattern from Leo’s turn.</p>
                </div>
            </header>

            <div className="round-xai__grid">
                <article>
                    <h4>
                        <SearchRounded /> What did it hear?
                    </h4>
                    <Spectrogram />
                    <p>The bright, high chirp matches patterns the model learned from bird sounds.</p>
                </article>

                <article>
                    <h4>
                        <DataUsageRounded /> Closest examples
                    </h4>
                    <ul className="round-xai__matches">
                        {similarSounds.map((description, index) => (
                            <li key={description}>
                                <span aria-hidden="true">{index === 0 ? '🐦' : index === 1 ? '🐤' : '🐧'}</span>
                                <div>
                                    <strong>Bird</strong>
                                    <small>{description}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>

                <article>
                    <h4>
                        <BiotechRounded /> What if we hide it?
                    </h4>
                    <div className="round-xai__change">
                        <span>Original</span>
                        <strong>🐦 Bird</strong>
                        <b>{leadingPrediction.confidence}%</b>
                    </div>
                    <span className="round-xai__arrow">↓</span>
                    <div className="round-xai__change">
                        <span>Without the chirp</span>
                        <strong>🐱 Cat</strong>
                        <b>22%</b>
                    </div>
                    <p>Removing one important sound region can change the AI’s answer.</p>
                </article>
            </div>
        </section>
    );
}
