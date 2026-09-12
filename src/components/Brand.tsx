type BrandProps = {
    large?: boolean;
};

export default function Brand({ large = false }: BrandProps) {
    return (
        <div className={`brand${large ? ' brand--large' : ''}`}>
            <svg
                className="brand__mark"
                viewBox="0 0 96 72"
                aria-hidden="true"
            >
                <path
                    d="M38 15a10 10 0 0 1 20 0v20a10 10 0 0 1-20 0V15Z"
                    fill="currentColor"
                />
                <path
                    d="M31 31v5a17 17 0 0 0 34 0v-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M48 53v12M38 66h20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M5 31h8m-4-8v16m11-23v30m8-23v16M83 31h8m-4-8v16M76 16v30m-8-23v16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            <div>
                <div className="brand__name">GenAI</div>
                <div className="brand__name">Sound Mimic</div>
            </div>
            {large && <p>Train sounds. Play together. Explain the AI.</p>}
        </div>
    );
}
