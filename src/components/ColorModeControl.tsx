import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import { useTranslation } from 'react-i18next';
import useColorMode, { type ColorMode } from '../hooks/useColorMode';

const modes: Array<{ labelKey: 'theme.light' | 'theme.dark'; value: ColorMode; icon: typeof LightModeRounded }> = [
    { labelKey: 'theme.light', value: 'light', icon: LightModeRounded },
    { labelKey: 'theme.dark', value: 'dark', icon: DarkModeRounded },
];

export default function ColorModeControl() {
    const { mode, setMode } = useColorMode();
    const { t } = useTranslation();

    return (
        <div
            aria-label={t('theme.label')}
            className="color-mode-control"
            role="group"
        >
            {modes.map(({ icon: Icon, labelKey, value }) => {
                const label = t(labelKey);
                const actionLabel = t('theme.use', { mode: label.toLocaleLowerCase() });
                return (
                    <button
                        aria-label={actionLabel}
                        aria-pressed={mode === value}
                        className={mode === value ? 'is-active' : undefined}
                        key={value}
                        onClick={() => setMode(value)}
                        title={actionLabel}
                        type="button"
                    >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
