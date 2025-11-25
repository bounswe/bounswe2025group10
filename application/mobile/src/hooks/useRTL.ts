import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextStyle, ViewStyle } from 'react-native';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Hook that provides RTL-aware styles based on the current language.
 * This works immediately after language change, without requiring app restart.
 */
export const useRTL = () => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language);

    return {
      isRTL,
      // Text styles for RTL alignment
      textStyle: {
        textAlign: (isRTL ? 'right' : 'left') as TextStyle['textAlign'],
        writingDirection: (isRTL ? 'rtl' : 'ltr') as TextStyle['writingDirection'],
      } as TextStyle,
      // Row styles for RTL layout
      rowStyle: {
        flexDirection: (isRTL ? 'row-reverse' : 'row') as ViewStyle['flexDirection'],
      } as ViewStyle,
      // Utility function to get alignment
      align: (isRTL ? 'flex-end' : 'flex-start') as ViewStyle['alignItems'],
      // Back arrow direction
      backArrow: isRTL ? '→' : '←',
      // Forward arrow direction
      forwardArrow: isRTL ? '←' : '→',
    };
  }, [i18n.language]);
};

export default useRTL;
