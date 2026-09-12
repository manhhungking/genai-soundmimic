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
