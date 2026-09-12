import type { ReactNode } from 'react';

type PanelHeadingProps = {
    icon: ReactNode;
    title: string;
    description?: string;
};

export default function PanelHeading({ icon, title, description }: PanelHeadingProps) {
    return (
        <header className="panel-heading">
            <span className="panel-heading__icon">{icon}</span>
            <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
        </header>
    );
}
