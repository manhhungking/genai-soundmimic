import SettingsRounded from '@mui/icons-material/SettingsRounded';
import { useTranslation } from 'react-i18next';
import LanguageControl from './LanguageControl';

type CornerControlsProps = {
    onOpenSettings?: () => void;
};

export default function CornerControls({ onOpenSettings }: CornerControlsProps) {
    const { t } = useTranslation();

    return (
        <div className="corner-controls">
            {onOpenSettings && (
                <button
                    aria-label={t('nav.settings')}
                    className="corner-controls__settings"
                    onClick={onOpenSettings}
                    type="button"
                >
                    <SettingsRounded aria-hidden="true" />
                </button>
            )}
            <LanguageControl />
        </div>
    );
}
