import { useId } from 'react';

const cells = Array.from({ length: 96 }, (_, index) => {
    const x = index % 16;
    const y = Math.floor(index / 16);
    const strength = (x * 17 + y * 29 + (x - y) ** 2) % 100;
    return { x, y, strength };
});

type SpectrogramProps = {
    label?: string;
};

export default function Spectrogram({
    label = 'A spectrogram with a highlighted high-pitch bird chirp',
}: SpectrogramProps) {
    const gradientId = useId();

    return (
        <svg
            className="spectrogram"
            viewBox="0 0 420 220"
            role="img"
            aria-label={label}
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop stopColor="var(--spectrogram-start)" />
                    <stop
                        offset="1"
                        stopColor="var(--spectrogram-end)"
                    />
                </linearGradient>
            </defs>
            <rect
                x="36"
                y="12"
                width="364"
                height="174"
                rx="10"
                fill={`url(#${gradientId})`}
            />
            {cells.map(({ x, y, strength }) => (
                <rect
                    key={`${x}-${y}`}
                    x={43 + x * 22}
                    y={20 + y * 27}
                    width="18"
                    height="22"
                    rx="3"
                    fill={
                        strength > 78
                            ? 'var(--spectrogram-high)'
                            : strength > 48
                              ? 'var(--spectrogram-mid)'
                              : 'var(--spectrogram-low)'
                    }
                    opacity={0.28 + strength / 155}
                />
            ))}
            <rect
                x="170"
                y="45"
                width="75"
                height="122"
                fill="none"
                stroke="var(--color-white)"
                strokeWidth="3"
                strokeDasharray="8 6"
            />
            <path
                d="M36 194H400M36 194V12"
                fill="none"
                stroke="var(--spectrogram-axis)"
                strokeWidth="2"
            />
            <text
                x="34"
                y="212"
                fill="var(--spectrogram-label)"
                fontSize="13"
            >
                0
            </text>
            <text
                x="151"
                y="212"
                fill="var(--spectrogram-label)"
                fontSize="13"
            >
                1
            </text>
            <text
                x="268"
                y="212"
                fill="var(--spectrogram-label)"
                fontSize="13"
            >
                2
            </text>
            <text
                x="391"
                y="212"
                fill="var(--spectrogram-label)"
                fontSize="13"
            >
                3s
            </text>
        </svg>
    );
}
