import type { ReactNode } from 'react';

type SetupStepHeaderProps = {
    action?: ReactNode;
    description: string;
    number: number;
    title: string;
    tone: 'blue' | 'teal' | 'violet';
};

export default function SetupStepHeader({ action, description, number, title, tone }: SetupStepHeaderProps) {
    return (
        <header className="setup-step-header">
            <span className={`setup-step-header__number setup-step-header__number--${tone}`}>{number}</span>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            {action}
        </header>
    );
}
