import CheckRounded from '@mui/icons-material/CheckRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultLanguage, isLanguageCode, languages, setAppLanguage } from '../i18n';

export default function LanguageControl() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const controlRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const selectedCode = isLanguageCode(i18n.resolvedLanguage) ? i18n.resolvedLanguage : defaultLanguage;
    const selectedLanguage = languages.find(({ code }) => code === selectedCode) ?? languages[0];

    useEffect(() => {
        if (!open) return;

        function closeOnOutsidePress(event: PointerEvent) {
            if (!controlRef.current?.contains(event.target as Node)) setOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setOpen(false);
            triggerRef.current?.focus();
        }

        document.addEventListener('pointerdown', closeOnOutsidePress);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    function changeLanguage(language: string) {
        if (!isLanguageCode(language)) return;
        void setAppLanguage(language);
        setOpen(false);
        triggerRef.current?.focus();
    }

    return (
        <div
            className={`language-control${open ? ' is-open' : ''}`}
            ref={controlRef}
        >
            <button
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={`${t('app.language')}: ${selectedLanguage.label}`}
                className="language-control__trigger"
                onClick={() => setOpen((isOpen) => !isOpen)}
                ref={triggerRef}
                type="button"
            >
                <LanguageRounded aria-hidden="true" />
                <span className="language-control__label">{selectedLanguage.label}</span>
                <span className="language-control__short-label">{selectedLanguage.shortLabel}</span>
                <ExpandMoreRounded
                    aria-hidden="true"
                    className="language-control__chevron"
                />
            </button>
            {open && (
                <ul
                    aria-label={t('app.language')}
                    className="language-control__menu"
                    role="listbox"
                >
                    {languages.map(({ code, label }) => (
                        <li
                            key={code}
                            role="presentation"
                        >
                            <button
                                aria-selected={code === selectedCode}
                                onClick={() => changeLanguage(code)}
                                role="option"
                                type="button"
                            >
                                <span>{label}</span>
                                {code === selectedCode && <CheckRounded aria-hidden="true" />}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
