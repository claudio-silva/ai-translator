import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales/translations';

const savedLanguage = localStorage.getItem('interfaceLanguage') || 'en';

interface TranslationResources {
  [key: string]: {
    translation: typeof translations.en;
  };
}

i18n
  .use(initReactI18next)
  .init({
    resources: Object.entries(translations).reduce((acc, [lang, trans]) => {
      acc[lang] = { translation: trans };
      return acc;
    }, {} as TranslationResources),
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 