import CloseRounded from '@mui/icons-material/CloseRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultLanguage, isLanguageCode, languages, setAppLanguage } from '../i18n';
import ColorModeControl from './ColorModeControl';

type SettingsDialogProps = {
    onClose: () => void;
    open: boolean;
};

export default function SettingsDialog({ onClose, open }: SettingsDialogProps) {
    const { i18n, t } = useTranslation();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const selectedLanguage = isLanguageCode(i18n.resolvedLanguage)
        ? i18n.resolvedLanguage
        : defaultLanguage;

    useEffect(() => {
        if (!open) return;

        closeButtonRef.current?.focus();
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            className="settings-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                aria-labelledby="settings-title"
                aria-modal="true"
                className="settings-dialog"
                role="dialog"
            >
                <header>
                    <h2 id="settings-title">{t('nav.settings')}</h2>
                    <button
                        aria-label={t('settings.close')}
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <CloseRounded aria-hidden="true" />
                    </button>
                </header>
                <div className="settings-dialog__section">
                    <h3>{t('app.language')}</h3>
                    <label className="settings-language-control">
                        <LanguageRounded aria-hidden="true" />
                        <select
                            aria-label={t('app.language')}
                            onChange={(event) => {
                                if (isLanguageCode(event.target.value)) {
                                    void setAppLanguage(event.target.value);
                                }
                            }}
                            value={selectedLanguage}
                        >
                            {languages.map(({ code, label }) => (
                                <option
                                    key={code}
                                    value={code}
                                >
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="settings-dialog__section">
                    <h3>{t('theme.label')}</h3>
                    <ColorModeControl />
                </div>
            </section>
        </div>
    );
}
