import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { defaultLanguage, isLanguageCode, languages, languageStorageKey, type LanguageCode } from './locales/config';

function getInitialLanguage(): LanguageCode {
    if (typeof window === 'undefined') return defaultLanguage;
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    return isLanguageCode(storedLanguage) ? storedLanguage : defaultLanguage;
}

function syncDocumentLanguage(language: string) {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
}

const initialLanguage = getInitialLanguage();

i18n.on('languageChanged', syncDocumentLanguage);

const initialization = i18n.use(Backend).use(initReactI18next).init({
    backend: {
        alternateFetch: (input: string, init: RequestInit) => fetch(input, init),
        loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },
    defaultNS: 'translation',
    fallbackLng: defaultLanguage,
    interpolation: { escapeValue: false },
    lng: initialLanguage,
    load: 'currentOnly',
    ns: ['translation'],
    supportedLngs: languages.map(({ code }) => code),
});

export async function setAppLanguage(language: LanguageCode, persist = true) {
    await initialization;
    await i18n.changeLanguage(language);
    if (persist && typeof window !== 'undefined') window.localStorage.setItem(languageStorageKey, language);
}

export const i18nReady = initialization;

export default i18n;
