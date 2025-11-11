import { colors, spacing, typography, commonStyles } from '../theme';

describe('theme utility', () => {
  describe('colors', () => {
    it('should have all required color definitions', () => {
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('primaryDark');
      expect(colors).toHaveProperty('primaryLight');
      expect(colors).toHaveProperty('white');
      expect(colors).toHaveProperty('black');
      expect(colors).toHaveProperty('darkGray');
      expect(colors).toHaveProperty('gray');
      expect(colors).toHaveProperty('lightGray');
      expect(colors).toHaveProperty('error');
      expect(colors).toHaveProperty('success');
    });

    it('should have correct color values', () => {
      expect(colors.primary).toBe('#4CAF50');
      expect(colors.white).toBe('#FFFFFF');
      expect(colors.black).toBe('#000000');
      expect(colors.error).toBe('#D32F2F');
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      Object.values(colors).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('spacing', () => {
    it('should have all spacing sizes', () => {
      expect(spacing).toHaveProperty('xs');
      expect(spacing).toHaveProperty('sm');
      expect(spacing).toHaveProperty('md');
      expect(spacing).toHaveProperty('lg');
      expect(spacing).toHaveProperty('xl');
    });

    it('should have correct spacing values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
    });

    it('should have increasing spacing values', () => {
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
    });
  });

  describe('typography', () => {
    it('should have all typography styles', () => {
      expect(typography).toHaveProperty('h1');
      expect(typography).toHaveProperty('h2');
      expect(typography).toHaveProperty('h3');
      expect(typography).toHaveProperty('body');
      expect(typography).toHaveProperty('bodyLarge');
      expect(typography).toHaveProperty('caption');
      expect(typography).toHaveProperty('button');
    });

    it('should have correct h1 style', () => {
      expect(typography.h1.fontSize).toBe(32);
      expect(typography.h1.fontWeight).toBe('700');
      expect(typography.h1.lineHeight).toBe(40);
    });

    it('should have correct h2 style', () => {
      expect(typography.h2.fontSize).toBe(24);
      expect(typography.h2.fontWeight).toBe('700');
      expect(typography.h2.lineHeight).toBe(32);
    });

    it('should have correct body style', () => {
      expect(typography.body.fontSize).toBe(16);
      expect(typography.body.lineHeight).toBe(24);
    });

    it('should have decreasing font sizes for headings', () => {
      expect(typography.h1.fontSize).toBeGreaterThan(typography.h2.fontSize);
      expect(typography.h2.fontSize).toBeGreaterThan(typography.h3.fontSize);
    });

    it('should have consistent line height ratio', () => {
      // Line height should be proportional to font size
      const h1Ratio = typography.h1.lineHeight / typography.h1.fontSize;
      const h2Ratio = typography.h2.lineHeight / typography.h2.fontSize;
      const bodyRatio = typography.body.lineHeight / typography.body.fontSize;
      
      expect(h1Ratio).toBeCloseTo(1.25, 1);
      expect(h2Ratio).toBeCloseTo(1.33, 1);
      expect(bodyRatio).toBeCloseTo(1.5, 1);
    });
  });

  describe('commonStyles', () => {
    it('should have all common style definitions', () => {
      expect(commonStyles).toHaveProperty('container');
      expect(commonStyles).toHaveProperty('input');
      expect(commonStyles).toHaveProperty('button');
      expect(commonStyles).toHaveProperty('buttonText');
    });

    it('should have correct container styles', () => {
      expect(commonStyles.container.flex).toBe(1);
      expect(commonStyles.container.backgroundColor).toBe(colors.white);
      expect(commonStyles.container.padding).toBe(spacing.md);
    });

    it('should have correct input styles', () => {
      expect(commonStyles.input.height).toBe(48);
      expect(commonStyles.input.borderWidth).toBe(1);
      expect(commonStyles.input.borderColor).toBe(colors.lightGray);
      expect(commonStyles.input.borderRadius).toBe(8);
      expect(commonStyles.input.paddingHorizontal).toBe(spacing.md);
      expect(commonStyles.input.marginBottom).toBe(spacing.md);
    });

    it('should have correct button styles', () => {
      expect(commonStyles.button.height).toBe(48);
      expect(commonStyles.button.backgroundColor).toBe(colors.primary);
      expect(commonStyles.button.borderRadius).toBe(8);
      expect(commonStyles.button.justifyContent).toBe('center');
      expect(commonStyles.button.alignItems).toBe('center');
      expect(commonStyles.button.marginVertical).toBe(spacing.md);
    });

    it('should have correct buttonText styles', () => {
      expect(commonStyles.buttonText.color).toBe(colors.white);
      expect(commonStyles.buttonText.fontSize).toBe(16);
      expect(commonStyles.buttonText.fontWeight).toBe('700');
    });

    it('should use theme colors consistently', () => {
      expect(commonStyles.container.backgroundColor).toBe(colors.white);
      expect(commonStyles.button.backgroundColor).toBe(colors.primary);
      expect(commonStyles.buttonText.color).toBe(colors.white);
      expect(commonStyles.input.borderColor).toBe(colors.lightGray);
    });

    it('should use theme spacing consistently', () => {
      expect(commonStyles.container.padding).toBe(spacing.md);
      expect(commonStyles.input.paddingHorizontal).toBe(spacing.md);
      expect(commonStyles.input.marginBottom).toBe(spacing.md);
      expect(commonStyles.button.marginVertical).toBe(spacing.md);
    });
  });
});

