import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultLanguage, isLanguageCode, languages, languageStorageKey, type LanguageCode } from './locales/config';
import { englishResources, loadLocale } from './locales/resources';

function getInitialLanguage(): LanguageCode {
    if (typeof window === 'undefined') return defaultLanguage;
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    return isLanguageCode(storedLanguage) ? storedLanguage : defaultLanguage;
}

function syncDocumentLanguage(language: string) {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
}

const initialLanguage = getInitialLanguage();

const initialization = i18n.use(initReactI18next).init({
    fallbackLng: defaultLanguage,
    interpolation: { escapeValue: false },
    lng: defaultLanguage,
    load: 'currentOnly',
    resources: englishResources,
    supportedLngs: languages.map(({ code }) => code),
});

i18n.on('languageChanged', syncDocumentLanguage);

export async function setAppLanguage(language: LanguageCode, persist = true) {
    await initialization;
    if (!i18n.hasResourceBundle(language, 'translation')) {
        i18n.addResourceBundle(language, 'translation', await loadLocale(language), true, true);
    }
    if (persist && typeof window !== 'undefined') window.localStorage.setItem(languageStorageKey, language);
    await i18n.changeLanguage(language);
}

export const i18nReady = initialization.then(async () => {
    await setAppLanguage(initialLanguage, false);
});

export default i18n;
