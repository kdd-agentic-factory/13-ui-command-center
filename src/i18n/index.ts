import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import es from './locales/es';
import it from './locales/it';
import fr from './locales/fr';
import ja from './locales/ja';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    it: { translation: it },
    fr: { translation: fr },
    ja: { translation: ja },
  },
  lng: localStorage.getItem('kdd-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
