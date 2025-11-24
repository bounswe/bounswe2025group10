import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = '@app_language';

// Language detector that uses AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // If no saved language, use device locale
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      
      // Map device language to supported languages, default to English
      const supportedLanguages = ['en', 'tr', 'es', 'fr'];
      const language = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(language);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Important for React Native
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

