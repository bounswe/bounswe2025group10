import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { logger } from '../utils/logger';

// Import translation files
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = '@app_language';

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Check if a language is RTL
export const isRTL = (language: string) => RTL_LANGUAGES.includes(language);

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
      const supportedLanguages = ['en', 'tr', 'es', 'fr', 'ar'];
      const language = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(language);
    } catch (error) {
      logger.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      logger.error('Error saving language:', error);
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
      ar: { translation: ar },
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

// Helper function to change language with RTL support
export const changeLanguage = async (language: string, autoRestart = true) => {
  try {
    const shouldBeRTL = isRTL(language);
    const currentRTL = I18nManager.isRTL;

    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);

    // If RTL setting needs to change, update and restart
    if (shouldBeRTL !== currentRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);

      logger.log('[i18n] RTL changed, restarting app...');

      if (autoRestart) {
        // Auto restart the app to apply RTL changes
        try {
          await Updates.reloadAsync();
        } catch (reloadError) {
          logger.warn('[i18n] Could not auto-restart:', reloadError);
          // Fallback to manual restart alert
          Alert.alert(
            'Restart Required',
            'Please close and reopen the app to apply the new layout direction.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  } catch (error) {
    logger.error('Error changing language:', error);
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;

// Initialize RTL based on saved language
export const initializeRTL = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    logger.log('[RTL] Saved language:', savedLanguage);
    logger.log('[RTL] Current I18nManager.isRTL:', I18nManager.isRTL);

    if (savedLanguage) {
      const shouldBeRTL = isRTL(savedLanguage);
      logger.log('[RTL] Should be RTL:', shouldBeRTL);

      // Always set RTL settings to ensure consistency
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);

      logger.log('[RTL] After setting - I18nManager.isRTL:', I18nManager.isRTL);

      // If mismatch persists, the app needs a full restart
      if (shouldBeRTL !== I18nManager.isRTL) {
        logger.log('[RTL] RTL mismatch detected - app needs restart');
      }
    }
  } catch (error) {
    logger.error('Error initializing RTL:', error);
  }
};

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
];

