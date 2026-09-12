import en from './en';
import type { LanguageCode } from './config';

type Locale = Record<keyof typeof en, string>;

const localeLoaders: Record<Exclude<LanguageCode, 'en-GB'>, () => Promise<{ default: Locale }>> = {
    'de-DE': () => import('./de'),
    'pt-BR': () => import('./pt'),
    'fr-FR': () => import('./fr'),
    'fi-FI': () => import('./fi'),
    'it-IT': () => import('./it'),
    'ja-JP': () => import('./ja'),
    'kr-KR': () => import('./ko'),
    'krl-FI': () => import('./krl'),
    'si-LK': () => import('./si'),
    sv: () => import('./sv'),
    sw: () => import('./sw'),
    'ru-RU': () => import('./ru'),
    'tr-TR': () => import('./tr'),
    'ua-UA': () => import('./uk'),
    'vi-VN': () => import('./vi'),
};

export const englishResources = { 'en-GB': { translation: en } };

export async function loadLocale(language: LanguageCode) {
    if (language === 'en-GB') return en;
    const { default: locale } = await localeLoaders[language]();
    return locale;
}
