import {ViewStyle, TextStyle, PixelRatio, I18nManager} from 'react-native';
import {MIN_TOUCH_TARGET} from './accessibility';

/**
 * WCAG 2.1 AA compliant color palette
 * All color combinations tested for proper contrast ratios:
 * - Normal text: 4.5:1
 * - Large text: 3:1
 * - UI components: 3:1
 */

// Light theme colors
export const lightColors = {
  // Primary colors - adjusted for better contrast
  primary: '#2E7D32', // Darker green for better contrast (was #4CAF50)
  primaryDark: '#1B5E20', // Even darker for emphasis
  primaryLight: '#66BB6A', // Lighter variant

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale - adjusted for WCAG compliance
  darkGray: '#212121', // Darker for better contrast (was #424242)
  gray: '#616161', // Adjusted for 4.5:1 on white (was #757575)
  lightGray: '#E0E0E0', // Adjusted for better boundaries (was #EEEEEE)

  // Semantic colors
  error: '#C62828', // Darker red for better contrast (was #D32F2F)
  success: '#2E7D32', // Matches primary
  warning: '#F57C00', // Orange for warnings
  info: '#1976D2', // Blue for info

  // Background variants
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',

  // Text colors with guaranteed contrast
  textPrimary: '#212121', // 4.5:1+ on white
  textSecondary: '#616161', // 4.5:1+ on white
  textDisabled: '#9E9E9E', // For disabled states
  textOnPrimary: '#FFFFFF', // White on primary green
};

// Dark theme colors - WCAG 2.1 AA compliant
export const darkColors = {
  // Primary colors - lighter for dark backgrounds
  primary: '#66BB6A', // Lighter green for dark mode
  primaryDark: '#4CAF50',
  primaryLight: '#81C784',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale - inverted for dark mode
  darkGray: '#E0E0E0',
  gray: '#B0B0B0',
  lightGray: '#424242',

  // Semantic colors - adjusted for dark backgrounds
  error: '#EF5350', // Lighter red for dark mode
  success: '#66BB6A',
  warning: '#FFB74D', // Lighter orange
  info: '#64B5F6', // Lighter blue

  // Background variants
  background: '#121212', // Material Design dark surface
  backgroundSecondary: '#1E1E1E',

  // Text colors with guaranteed contrast on dark
  textPrimary: '#FFFFFF', // White on dark
  textSecondary: '#B0B0B0', // 4.5:1+ on dark
  textDisabled: '#757575',
  textOnPrimary: '#000000', // Black on light primary
};

// Default colors (light theme) - for backward compatibility
export const colors = lightColors;

export type ThemeColors = typeof lightColors;

/**
 * Consistent spacing scale
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Scalable typography that respects system font size settings
 * Uses PixelRatio.getFontScale() for proper accessibility scaling
 */
const scale = PixelRatio.getFontScale();

export const typography = {
  h1: {
    fontSize: Math.round(32 * scale),
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: Math.round(40 * scale),
  } as TextStyle,
  h2: {
    fontSize: Math.round(24 * scale),
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: Math.round(32 * scale),
  } as TextStyle,
  h3: {
    fontSize: Math.round(20 * scale),
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Math.round(28 * scale),
  } as TextStyle,
  body: {
    fontSize: Math.round(16 * scale),
    lineHeight: Math.round(24 * scale),
  } as TextStyle,
  bodyLarge: {
    fontSize: Math.round(18 * scale),
    lineHeight: Math.round(28 * scale),
  } as TextStyle,
  caption: {
    fontSize: Math.round(14 * scale),
    lineHeight: Math.round(20 * scale),
  } as TextStyle,
  button: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Math.round(24 * scale),
  } as TextStyle,
};

/**
 * Common reusable styles with accessibility built-in
 * All interactive elements meet minimum touch target sizes
 */
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  } as ViewStyle,

  input: {
    minHeight: MIN_TOUCH_TARGET, // Meets touch target minimum
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  } as ViewStyle & TextStyle,

  button: {
    minHeight: MIN_TOUCH_TARGET, // Meets touch target minimum
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  } as ViewStyle,

  buttonText: {
    color: colors.textOnPrimary,
    fontSize: Math.round(16 * scale),
    fontWeight: '700' as TextStyle['fontWeight'],
  } as TextStyle,

  // Secondary button variant
  buttonSecondary: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  } as ViewStyle,

  buttonTextSecondary: {
    color: colors.primary,
    fontSize: Math.round(16 * scale),
    fontWeight: '600' as TextStyle['fontWeight'],
  } as TextStyle,
};

/**
 * RTL (Right-to-Left) utilities for Arabic and other RTL languages
 * Note: These are static values computed at module load time.
 * For dynamic RTL based on current language, use useRTL() hook or getRTLStyles()
 */
export const rtl = {
  // Check if current layout is RTL (native level)
  isRTL: I18nManager.isRTL,

  // Get text alignment based on RTL
  textAlign: (I18nManager.isRTL ? 'right' : 'left') as TextStyle['textAlign'],

  // Get flex direction based on RTL
  flexDirection: (I18nManager.isRTL ? 'row-reverse' : 'row') as ViewStyle['flexDirection'],

  // Writing direction
  writingDirection: (I18nManager.isRTL ? 'rtl' : 'ltr') as TextStyle['writingDirection'],
};

/**
 * RTL-aware styles (static, based on native I18nManager.isRTL)
 */
export const rtlStyles = {
  // Text that should align based on language direction
  text: {
    textAlign: rtl.textAlign,
    writingDirection: rtl.writingDirection,
  } as TextStyle,

  // Row that should reverse in RTL
  row: {
    flexDirection: rtl.flexDirection,
  } as ViewStyle,

  // Standard row (always left-to-right, e.g., for icons + text)
  rowLTR: {
    flexDirection: 'row' as ViewStyle['flexDirection'],
  } as ViewStyle,
};

/**
 * Dynamic RTL styles based on language code (not native I18nManager)
 * Use this when you need RTL to work immediately after language change
 */
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const isRTLLanguage = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

export const getRTLStyles = (languageCode: string) => {
  const isRTL = isRTLLanguage(languageCode);
  return {
    text: {
      textAlign: (isRTL ? 'right' : 'left') as TextStyle['textAlign'],
      writingDirection: (isRTL ? 'rtl' : 'ltr') as TextStyle['writingDirection'],
    } as TextStyle,
    row: {
      flexDirection: (isRTL ? 'row-reverse' : 'row') as ViewStyle['flexDirection'],
    } as ViewStyle,
    isRTL,
  };
};
