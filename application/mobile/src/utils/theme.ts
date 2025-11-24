import {ViewStyle, TextStyle, PixelRatio} from 'react-native';
import {MIN_TOUCH_TARGET} from './accessibility';

/**
 * WCAG 2.1 AA compliant color palette
 * All color combinations tested for proper contrast ratios:
 * - Normal text: 4.5:1
 * - Large text: 3:1
 * - UI components: 3:1
 */
export const colors = {
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
