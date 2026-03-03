import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';

// Supported languages
export const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
];

// EU languages (for GDPR compliance)
export const euLanguages = supportedLanguages.filter(lang =>
    ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'sv'].includes(lang.code)
);

const resources = {
    en: { translation: enTranslation },
    de: { translation: deTranslation },
    // Add more languages as needed
    fr: { translation: enTranslation }, // Fallback to English
    es: { translation: enTranslation }, // Fallback to English
    it: { translation: enTranslation }, // Fallback to English
    nl: { translation: enTranslation }, // Fallback to English
    pl: { translation: enTranslation }, // Fallback to English
    sv: { translation: enTranslation }, // Fallback to English
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'complianceos-language',
        },
    });

export default i18n;

export const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem('complianceos-language', lang);
};

export const getCurrentLanguage = () => i18n.language;

export const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang?.nativeName || code;
};
