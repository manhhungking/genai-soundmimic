import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
import { defaultLanguage, isLanguageCode, languages } from '../locales/config';

export default function LanguageControl() {
    const { t, i18n } = useTranslation();
    const selectedCode = isLanguageCode(i18n.resolvedLanguage) ? i18n.resolvedLanguage : defaultLanguage;
    const selectedLanguage = languages.find(({ code }) => code === selectedCode) ?? languages[0];

    function changeLanguage(language: string) {
        if (!isLanguageCode(language)) return;
        void setAppLanguage(language);
    }

    return (
        <label className="language-control">
            <LanguageRounded aria-hidden="true" />
            <span
                aria-hidden="true"
                className="language-control__short-label"
            >
                {selectedLanguage.shortLabel}
            </span>
            <select
                aria-label={t('app.language')}
                onChange={(event) => changeLanguage(event.target.value)}
                value={selectedCode}
            >
                {languages.map(({ code, label }) => (
                    <option key={code} value={code}>
                        {label}
                    </option>
                ))}
            </select>
            <ExpandMoreRounded aria-hidden="true" />
        </label>
    );
}
