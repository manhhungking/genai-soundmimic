import GitHub from '@mui/icons-material/GitHub';
import { useTranslation } from 'react-i18next';

type ProjectLinksProps = {
    compact?: boolean;
    entry?: boolean;
};

export default function ProjectLinks({ compact = false, entry = false }: ProjectLinksProps) {
    const { t } = useTranslation();
    const classes = ['project-links', compact && 'project-links--compact', entry && 'project-links--entry']
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes}>
            <a
                aria-label={t('app.github')}
                className="project-links__github"
                href="https://github.com/manhhungking/genai-soundmimic"
                rel="noreferrer"
                target="_blank"
            >
                <GitHub />
            </a>
            <a
                href="https://generation-ai.eu/privacy-policy/"
                rel="noreferrer"
                target="_blank"
            >
                {t('app.privacy')}
            </a>
        </div>
    );
}
