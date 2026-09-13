import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

export const languages = [
    { code: 'en-GB', label: 'English', shortLabel: 'EN' },
    { code: 'de-DE', label: 'Deutsch', shortLabel: 'DE' },
    { code: 'pt-BR', label: 'Português Brasileiro', shortLabel: 'PT' },
    { code: 'fr-FR', label: 'Français', shortLabel: 'FR' },
    { code: 'fi-FI', label: 'Suomi', shortLabel: 'FI' },
    { code: 'it-IT', label: 'Italiano', shortLabel: 'IT' },
    { code: 'ja-JP', label: '日本語', shortLabel: '日' },
    { code: 'kr-KR', label: '한국어', shortLabel: 'KO' },
    { code: 'krl-FI', label: 'Karjala', shortLabel: 'KL' },
    { code: 'si-LK', label: 'සිංහල', shortLabel: 'SI' },
    { code: 'sv', label: 'Svenska', shortLabel: 'SV' },
    { code: 'sw', label: 'Swahili', shortLabel: 'SW' },
    { code: 'ru-RU', label: 'русский язык', shortLabel: 'RU' },
    { code: 'tr-TR', label: 'Türkçe', shortLabel: 'TR' },
    { code: 'ua-UA', label: 'Українська', shortLabel: 'UA' },
    { code: 'vi-VN', label: 'Tiếng Việt', shortLabel: 'VI' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

export const defaultLanguage: LanguageCode = 'en-GB';
export const languageStorageKey = 'sound-mimic-language';

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
    return languages.some(({ code }) => code === value);
}

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
