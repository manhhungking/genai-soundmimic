const bars = [26, 45, 34, 57, 39, 69, 48, 61, 31, 53, 72, 42, 59, 35, 66, 45, 55, 28, 49, 37, 60, 33, 46, 25];

type TrainingWaveformProps = {
    active?: boolean;
};

export default function TrainingWaveform({ active = false }: TrainingWaveformProps) {
    return (
        <div
            className={`training-waveform${active ? ' training-waveform--active' : ''}`}
            role="img"
            aria-label={active ? 'Live sound waveform' : 'Recorded sound samples'}
        >
            {bars.map((height, index) => (
                <span
                    key={`${height}-${index}`}
                    style={{ height: `${height}%`, animationDelay: `${index * -40}ms` }}
                />
            ))}
        </div>
    );
}
