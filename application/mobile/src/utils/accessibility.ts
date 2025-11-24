/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Provides scalable typography, color contrast validation, and touch target helpers
 */

import {PixelRatio, Platform} from 'react-native';

/**
 * Normalize font size based on device pixel ratio for consistent scaling
 * This ensures text scales properly with system accessibility settings
 */
export const normalize = (size: number): number => {
  const scale = PixelRatio.getFontScale();
  return Math.round(size * scale);
};

/**
 * Scalable font sizes that adapt to system font size settings
 * These replace fixed fontSize values to support up to 200% scaling
 */
export const scalableFontSizes = {
  xs: normalize(12),
  sm: normalize(14),
  base: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  '2xl': normalize(24),
  '3xl': normalize(32),
} as const;

/**
 * Minimum touch target sizes according to platform guidelines
 * iOS: 44x44 pt, Android: 48x48 dp
 * Reference: WCAG 2.5.5 (AAA) recommends 44x44, both platforms meet this
 */
export const MIN_TOUCH_TARGET = Platform.select({
  ios: 44,
  android: 48,
  default: 48,
});

/**
 * Helper to ensure a component meets minimum touch target size
 * Usage: { ...getTouchTargetStyle(), ...otherStyles }
 */
export const getTouchTargetStyle = () => ({
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
});

/**
 * WCAG 2.1 AA Contrast Ratios
 * Normal text (< 18pt or < 14pt bold): 4.5:1
 * Large text (≥ 18pt or ≥ 14pt bold): 3:1
 */
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  UI_COMPONENTS: 3.0,
} as const;

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param hex - Color in hex format (#RRGGBB)
 */
const getLuminance = (hex: string): number => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 * @param foreground - Text/foreground color
 * @param background - Background color
 * @param isLargeText - Whether text is large (≥18pt or ≥14pt bold)
 */
export const meetsContrastRequirement = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText
    ? CONTRAST_RATIOS.LARGE_TEXT
    : CONTRAST_RATIOS.NORMAL_TEXT;
  return ratio >= required;
};

/**
 * Accessibility props helper for better screen reader support
 */
export const a11yProps = (label: string, hint?: string, role?: string) => ({
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: role as any,
  accessible: true,
});
