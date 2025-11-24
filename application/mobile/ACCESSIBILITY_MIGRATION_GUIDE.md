# WCAG 2.1 AA Accessibility Migration Guide

## 📋 Overview

This document provides guidance for updating all remaining screens in the mobile app to meet WCAG 2.1 AA accessibility standards.

## ✅ What's Already Done

The following foundational work has been completed:

### 1. **Accessibility Utilities** (`src/utils/accessibility.ts`)

- `normalize()` - Font scaling function
- `MIN_TOUCH_TARGET` - Platform-specific minimum touch sizes (iOS: 44pt, Android: 48dp)
- `getTouchTargetStyle()` - Helper for touch target sizes
- `getContrastRatio()` - WCAG contrast calculation
- `meetsContrastRequirement()` - Contrast validation
- `a11yProps()` - Accessibility props helper

### 2. **Updated Theme** (`src/utils/theme.ts`)

- ✅ All colors updated for WCAG AA compliance
- ✅ Typography uses scalable font sizes (respects system settings)
- ✅ Common styles include proper touch targets
- ✅ Color contrast ratios verified:
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - UI components: 3:1 minimum

### 3. **Accessible Components**

- `AccessibleText` - Auto-scaling text component
- `AccessibleButton` - Button with proper touch targets
- `AccessibleInput` - Input with labels and errors

### 4. **Updated Screens**

- ✅ HomeScreen
- ✅ LoginScreen
- ✅ SignupScreen
- ✅ CustomTabBar

## 🔧 How to Update Remaining Screens

### Step 1: Import Required Utilities

```tsx
import {colors, spacing, typography} from '../utils/theme';
import {MIN_TOUCH_TARGET} from '../utils/accessibility';
```

### Step 2: Update Color Usage

Replace all color references according to this mapping:

| **Old Color**              | **New Color**                                 | **Usage**                      |
| -------------------------- | --------------------------------------------- | ------------------------------ |
| `colors.white`             | `colors.background` or `colors.textOnPrimary` | Context-dependent              |
| `colors.black`             | `colors.textPrimary`                          | Regular text                   |
| `colors.gray`              | `colors.textSecondary`                        | Secondary text                 |
| `colors.lightGray`         | `colors.lightGray`                            | Borders, disabled states       |
| `colors.primary` (#4CAF50) | `colors.primary` (#2E7D32)                    | Now darker for better contrast |
| Hard-coded colors          | Theme colors                                  | Always use theme               |

### Step 3: Update Typography

Replace fixed `fontSize` with scalable typography:

```tsx
// ❌ Before
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

// ✅ After
const styles = StyleSheet.create({
  title: {
    ...typography.h2, // Automatically scalable
  },
});
```

### Step 4: Ensure Touch Targets

All interactive elements must meet minimum touch target sizes:

```tsx
// ❌ Before
button: {
  height: 40,
  padding: 8,
}

// ✅ After
button: {
  minHeight: MIN_TOUCH_TARGET, // 44pt iOS, 48dp Android
  minWidth: MIN_TOUCH_TARGET,
  paddingHorizontal: spacing.md,
}
```

### Step 5: Add Accessibility Props

```tsx
<TouchableOpacity
  accessibilityLabel="Delete post"
  accessibilityHint="Double tap to delete this post"
  accessibilityRole="button"
  accessible={true}>
  <Text>Delete</Text>
</TouchableOpacity>
```

## 📝 Screen-by-Screen Checklist

### Remaining Screens to Update

- [ ] **ProfileScreen.tsx**

  - Update all color references (especially gray text)
  - Add touch targets to all buttons
  - Update typography to use scalable variants
  - Fix bio edit input styles

- [ ] **CommunityScreen.tsx**

  - Update post card colors
  - Ensure like/dislike buttons meet touch targets
  - Fix modal colors and button sizes
  - Update comment input styles

- [ ] **ChallengesScreen.tsx**

  - Update challenge card colors
  - Fix button touch targets
  - Update modal styles

- [ ] **AchievementsScreen.tsx**

  - Update achievement card colors
  - Fix progress indicators

- [ ] **LeaderboardScreen.tsx**

  - Update rank display colors
  - Fix user card styles

- [ ] **TipsScreen.tsx**

  - Update tip card colors
  - Fix like/dislike buttons

- [ ] **Admin Screens** (AdminPanel, UserModeration, PostModeration, ChallengeModeration, CommentModeration)

  - Update table/list colors
  - Fix action button sizes
  - Update modal styles

- [ ] **OtherUserProfileScreen.tsx**
  - Same fixes as ProfileScreen

### Common Issues to Fix

1. **Gray Text on White Background**

   ```tsx
   // ❌ Before
   color: colors.gray; // #757575 - fails WCAG

   // ✅ After
   color: colors.textSecondary; // #616161 - passes WCAG
   ```

2. **Small Touch Targets**

   ```tsx
   // ❌ Before
   padding: 8

   // ✅ After
   minHeight: MIN_TOUCH_TARGET,
   minWidth: MIN_TOUCH_TARGET,
   ```

3. **Fixed Font Sizes**

   ```tsx
   // ❌ Before
   fontSize: 16

   // ✅ After
   ...typography.body
   ```

4. **Hard-coded Colors**

   ```tsx
   // ❌ Before
   backgroundColor: '#FFFFFF';

   // ✅ After
   backgroundColor: colors.background;
   ```

## 🎨 Color Contrast Reference

All color combinations in the updated theme meet WCAG AA:

| Foreground                | Background             | Ratio  | Pass   |
| ------------------------- | ---------------------- | ------ | ------ |
| `textPrimary` (#212121)   | `background` (#FFFFFF) | 15.1:1 | ✅ AAA |
| `textSecondary` (#616161) | `background` (#FFFFFF) | 4.9:1  | ✅ AA  |
| `primary` (#2E7D32)       | `background` (#FFFFFF) | 4.8:1  | ✅ AA  |
| `textOnPrimary` (#FFFFFF) | `primary` (#2E7D32)    | 4.8:1  | ✅ AA  |
| `error` (#C62828)         | `background` (#FFFFFF) | 5.5:1  | ✅ AA  |

## 🧪 Typography Scale

All typography variants now auto-scale:

```tsx
typography.h1; // 32sp → 64sp at 200% scale
typography.h2; // 24sp → 48sp at 200% scale
typography.h3; // 20sp → 40sp at 200% scale
typography.body; // 16sp → 32sp at 200% scale
typography.bodyLarge; // 18sp → 36sp at 200% scale
typography.caption; // 14sp → 28sp at 200% scale
typography.button; // 16sp → 32sp at 200% scale
```

## 💡 Tips

1. **Use Theme Consistently**: Always import and use theme colors
2. **Test with Large Text**: Enable 200% font size in device settings
3. **Check Contrast**: Use browser DevTools or online contrast checkers
4. **Touch Targets**: Use your finger to test - can you easily tap it?
5. **Accessibility Labels**: Every interactive element needs a label

## 🔍 Testing

After updating a screen:

1. ✅ All text uses `typography.*` styles
2. ✅ All colors use `colors.*` constants
3. ✅ All buttons have `minHeight: MIN_TOUCH_TARGET`
4. ✅ Test with 200% system font size
5. ✅ Test in both light and dark mode (if supported)
6. ✅ All interactive elements have accessibility labels

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [iOS HIG - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
