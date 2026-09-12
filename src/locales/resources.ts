import en from './en';
import type { LanguageCode } from './config';

type Locale = Record<keyof typeof en, string>;

const localeLoaders: Record<Exclude<LanguageCode, 'en'>, () => Promise<{ default: Locale }>> = {
    ja: () => import('./ja'),
    pt: () => import('./pt'),
    es: () => import('./es'),
    de: () => import('./de'),
    ru: () => import('./ru'),
    fr: () => import('./fr'),
    'zh-CN': () => import('./zh-CN'),
    'zh-TW': () => import('./zh-TW'),
    ko: () => import('./ko'),
    th: () => import('./th'),
    vi: () => import('./vi'),
};

export const englishResources = { en: { translation: en } };

export async function loadLocale(language: LanguageCode) {
    if (language === 'en') return en;
    const { default: locale } = await localeLoaders[language]();
    return locale;
}
