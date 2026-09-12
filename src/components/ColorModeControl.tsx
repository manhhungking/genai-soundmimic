import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import useColorMode, { type ColorMode } from '../hooks/useColorMode';

const modes: Array<{ label: string; value: ColorMode; icon: typeof LightModeRounded }> = [
    { label: 'Light', value: 'light', icon: LightModeRounded },
    { label: 'Dark', value: 'dark', icon: DarkModeRounded },
];

export default function ColorModeControl() {
    const { mode, setMode } = useColorMode();

    return (
        <div
            aria-label="Color mode"
            className="color-mode-control"
            role="group"
        >
            {modes.map(({ icon: Icon, label, value }) => (
                <button
                    aria-label={`Use ${label.toLowerCase()} mode`}
                    aria-pressed={mode === value}
                    className={mode === value ? 'is-active' : undefined}
                    key={value}
                    onClick={() => setMode(value)}
                    title={`${label} mode`}
                    type="button"
                >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
