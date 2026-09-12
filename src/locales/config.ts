export const languages = [
    { code: 'en', label: 'English', shortLabel: 'EN' },
    { code: 'ja', label: '日本語', shortLabel: '日' },
    { code: 'pt', label: 'Português', shortLabel: 'PT' },
    { code: 'es', label: 'Español', shortLabel: 'ES' },
    { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
    { code: 'ru', label: 'Русский', shortLabel: 'RU' },
    { code: 'fr', label: 'Français', shortLabel: 'FR' },
    { code: 'zh-CN', label: '简体中文', shortLabel: '简' },
    { code: 'zh-TW', label: '繁體中文', shortLabel: '繁' },
    { code: 'ko', label: '한국어', shortLabel: 'KO' },
    { code: 'th', label: 'ไทย', shortLabel: 'TH' },
    { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

export const defaultLanguage: LanguageCode = 'en';
export const languageStorageKey = 'sound-mimic-language';

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
    return languages.some(({ code }) => code === value);
}
