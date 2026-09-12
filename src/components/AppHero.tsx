import Waveform from './Waveform';

type AppHeroProps = {
    title: string;
    description: React.ReactNode;
    slogan: React.ReactNode;
    bubble: string;
    status?: React.ReactNode;
};

export default function AppHero({ title, description, slogan, bubble, status }: AppHeroProps) {
    return (
        <section
            className="app-hero"
            aria-labelledby="view-title"
        >
            <div className="app-hero__copy">
                <h1 id="view-title">{title}</h1>
                <p>{description}</p>
                <div className="app-hero__slogan">
                    <Waveform compact />
                    <span>{slogan}</span>
                </div>
            </div>
            <div className="app-hero__bubble">{bubble}</div>
            {status && <div className="app-hero__status">{status}</div>}
        </section>
    );
}
