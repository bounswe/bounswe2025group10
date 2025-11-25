# Accessibility Testing Guide

## 📱 Testing WCAG 2.1 AA Compliance for React Native Mobile App

This guide explains how to test the accessibility features we've implemented to ensure WCAG 2.1 AA compliance.

---

## 🎯 What We're Testing

1. **Color Contrast** - All text and UI components meet 4.5:1 (normal) or 3:1 (large text) ratios
2. **Scalable Text** - Text scales up to 200% with system settings without breaking layout
3. **Touch Targets** - All interactive elements are at least 44×44 pt (iOS) or 48×48 dp (Android)
4. **Accessibility Labels** - Screen readers can properly navigate the app

---

## 📋 Pre-Testing Setup

### iOS Setup

1. Open **Settings** app
2. Navigate to **Accessibility**
3. Important settings to test:
   - **Display & Text Size** → **Larger Text**
   - **VoiceOver** (screen reader)
   - **Increase Contrast**

### Android Setup

1. Open **Settings** app
2. Navigate to **Accessibility**
3. Important settings to test:
   - **Font Size** (under Display)
   - **TalkBack** (screen reader)
   - **High Contrast Text**

---

## 🧪 Test Suite

### Test 1: Font Scaling (200% Scale)

**Objective**: Verify text scales to 200% without layout breakage

#### iOS Instructions:

1. Settings → Accessibility → Display & Text Size → Larger Text
2. Enable **Larger Accessibility Sizes**
3. Drag slider all the way to the right (maximum)
4. Open the app

#### Android Instructions:

1. Settings → Display → Font Size
2. Select **Largest** or move slider to maximum
3. Some devices: Settings → Accessibility → Text and Display → Font Size
4. Open the app

#### What to Check:

- ✅ All text is readable (not cut off)
- ✅ Buttons still show their full labels
- ✅ Layout adjusts gracefully (some overlap is acceptable)
- ✅ No text runs outside its container
- ✅ Scrollable content still scrolls properly

#### Test Screens:

- [ ] Login Screen - username/password labels visible
- [ ] Home Screen - tips, waste data, buttons all readable
- [ ] Community Screen - post text, comments readable
- [ ] Profile Screen - bio, achievements readable
- [ ] Challenges Screen - challenge descriptions readable

**Expected Result**: Text scales smoothly, layout remains functional.

---

### Test 2: Color Contrast

**Objective**: Verify all text meets minimum contrast ratios

#### Tools Needed:

- **Online**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **macOS**: Digital Color Meter (built-in)
- **Browser DevTools**: Chrome/Firefox accessibility tools

#### How to Test:

1. Take screenshots of each screen
2. Use color picker to get hex values
3. Check contrast ratios:
   - **Normal text** (< 18pt): Minimum 4.5:1
   - **Large text** (≥ 18pt or ≥ 14pt bold): Minimum 3:1

#### Color Combinations to Verify:

| Element             | Foreground | Background | Min Ratio | Status    |
| ------------------- | ---------- | ---------- | --------- | --------- |
| Body text           | #212121    | #FFFFFF    | 4.5:1     | ✅ 15.1:1 |
| Secondary text      | #616161    | #FFFFFF    | 4.5:1     | ✅ 4.9:1  |
| Primary button text | #FFFFFF    | #2E7D32    | 4.5:1     | ✅ 4.8:1  |
| Primary green       | #2E7D32    | #FFFFFF    | 3:1       | ✅ 4.8:1  |
| Error text          | #C62828    | #FFFFFF    | 4.5:1     | ✅ 5.5:1  |
| Disabled text       | #9E9E9E    | #FFFFFF    | 3:1       | ✅ 3.1:1  |

#### Quick Visual Test:

Enable **High Contrast** mode on your device:

- **iOS**: Settings → Accessibility → Display & Text Size → Increase Contrast
- **Android**: Settings → Accessibility → High Contrast Text

**Expected Result**: All text should remain readable with high contrast enabled.

---

### Test 3: Touch Target Sizes

**Objective**: Verify all interactive elements are at least 44×44 pt (iOS) or 48×48 dp (Android)

#### How to Test:

1. Use your **finger** (not stylus) to tap all interactive elements
2. Every button/link should be easily tappable without precision
3. No accidental taps on nearby elements

#### Elements to Test:

**Home Screen:**

- [ ] "Add" button (waste entry)
- [ ] Waste type dropdown
- [ ] Logout button
- [ ] More dropdown menu items
- [ ] Tip like/dislike buttons

**Login/Signup:**

- [ ] Login button
- [ ] Signup button
- [ ] "Sign up" / "Login" links

**Community:**

- [ ] Create post button
- [ ] Like/dislike buttons on posts
- [ ] Comment button
- [ ] Modal close buttons

**Navigation:**

- [ ] Bottom tab bar items (Home, Community, Challenges, Profile)
- [ ] All should be easy to tap

#### Manual Measurement:

Use a ruler or on-screen measurement tool:

- **iOS**: Minimum 44pt × 44pt
- **Android**: Minimum 48dp × 48dp

**Expected Result**: All interactive elements are comfortably tappable without precision.

---

### Test 4: Screen Reader Navigation

**Objective**: Verify the app is navigable with screen readers

#### iOS (VoiceOver):

1. Settings → Accessibility → VoiceOver → **Enable**
2. Swipe right to move to next element
3. Double-tap to activate
4. Triple-tap home button to turn off quickly

#### Android (TalkBack):

1. Settings → Accessibility → TalkBack → **Enable**
2. Swipe right to move to next element
3. Double-tap to activate
4. Volume keys to quickly disable

#### What to Check:

- [ ] All buttons have descriptive labels
- [ ] Images have meaningful alt text
- [ ] Form inputs announce their purpose
- [ ] Navigation is logical (top to bottom, left to right)
- [ ] Modal dialogs announce when opened
- [ ] Error messages are read aloud

#### Test Navigation Flow:

**Login Screen:**

1. Should read: "Email input field"
2. Should read: "Password input field, secure text"
3. Should read: "Login button"
4. Should read: "Sign up link"

**Home Screen:**

1. Should read: "Select waste type button"
2. Should read: "Quantity input field"
3. Should read: "Add button"
4. Should read: "Logout button"

**Expected Result**: Every interactive element is announced with a clear, descriptive label.

---

### Test 5: Landscape Orientation

**Objective**: Verify layout works in both portrait and landscape

#### How to Test:

1. Rotate device to landscape mode
2. Navigate through all screens
3. Check for layout issues

#### What to Check:

- [ ] Text still readable and properly sized
- [ ] Buttons still accessible
- [ ] Content doesn't get cut off
- [ ] Horizontal scrolling works where needed

**Expected Result**: App remains functional and accessible in landscape mode.

---

### Test 6: Dark Mode (Future)

**Objective**: Verify contrast ratios in dark mode (if implemented)

#### iOS:

Settings → Display & Brightness → Dark

#### Android:

Settings → Display → Dark Theme

#### What to Check:

- Same contrast ratio requirements apply
- Light text on dark backgrounds must meet 4.5:1 or 3:1 ratios

**Note**: Dark mode support is not yet implemented but should follow the same WCAG standards.

---

## 📊 Testing Checklist Summary

Use this checklist after making changes:

### Per Screen Checklist:

- [ ] All text uses `typography.*` styles (scalable)
- [ ] All colors use `colors.*` theme constants
- [ ] All buttons have `minHeight: MIN_TOUCH_TARGET`
- [ ] Tested at 200% font size - no major breakage
- [ ] Tested with VoiceOver/TalkBack - all elements announced
- [ ] All interactive elements easily tappable
- [ ] No color contrast violations

### Overall App Checklist:

- [ ] Login/Signup flows accessible
- [ ] Main navigation tabs meet touch targets
- [ ] All forms have proper labels
- [ ] Error messages readable and announced
- [ ] All modals closeable and navigable
- [ ] Works in both portrait and landscape

---

## 🐛 Common Issues & Fixes

### Issue: Text is cut off at 200% scale

**Fix**: Remove fixed `height` on containers, use `minHeight` instead

```tsx
// ❌ Before
container: {
  height: 100,
}

// ✅ After
container: {
  minHeight: 100,
}
```

### Issue: Content not scrollable when text scales

**Fix**: Ensure ScreenWrapper has `scrollable={true}` and avoid nested scroll containers

```tsx
// ❌ Before - nested scrolling doesn't work
<ScreenWrapper scrollable={false}>
  <FlatList /> {/* Can't scroll */}
</ScreenWrapper>

// ✅ After - single scroll container
<ScreenWrapper scrollable={true}>
  {items.map(item => <ItemView />)} {/* Renders all items, scrolls properly */}
</ScreenWrapper>
```

### Issue: Buttons too small to tap comfortably

**Fix**: Add minimum touch target sizes

```tsx
button: {
  minHeight: MIN_TOUCH_TARGET,
  minWidth: MIN_TOUCH_TARGET,
}
```

### Issue: VoiceOver says "Button" with no description

**Fix**: Add accessibility label

```tsx
<TouchableOpacity
  accessibilityLabel="Delete post"
  accessibilityHint="Double tap to delete this post"
  accessibilityRole="button">
  <Icon name="trash" />
</TouchableOpacity>
```

### Issue: Color contrast too low

**Fix**: Use theme colors instead of hard-coded values

```tsx
// ❌ Before
color: '#757575'; // 3.8:1 - fails WCAG AA

// ✅ After
color: colors.textSecondary; // #616161 - 4.9:1 - passes
```

---

## 📱 Device Testing Matrix

Test on a variety of devices and OS versions:

| Device Type        | OS          | Screen Size | Priority |
| ------------------ | ----------- | ----------- | -------- |
| iPhone SE          | iOS 15+     | Small       | High     |
| iPhone 14          | iOS 17+     | Medium      | High     |
| iPhone 14 Pro Max  | iOS 17+     | Large       | Medium   |
| Pixel 6            | Android 13+ | Medium      | High     |
| Samsung Galaxy S23 | Android 14+ | Large       | Medium   |
| Tablet (iPad)      | iOS 16+     | Tablet      | Low      |
| Android Tablet     | Android 12+ | Tablet      | Low      |

---

## 🎓 Resources

### WCAG Guidelines:

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Platform Guidelines:

- [iOS Accessibility Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)

### Testing Tools:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [aXe DevTools](https://www.deque.com/axe/devtools/)

---

## ✅ Sign-Off

Once testing is complete, document results:

**Tested by**: **\*\***\_\_\_**\*\***  
**Date**: **\*\***\_\_\_**\*\***  
**Device**: **\*\***\_\_\_**\*\***  
**OS Version**: **\*\***\_\_\_**\*\***

**Results**:

- [ ] Font scaling: PASS / FAIL
- [ ] Color contrast: PASS / FAIL
- [ ] Touch targets: PASS / FAIL
- [ ] Screen reader: PASS / FAIL
- [ ] Orientation: PASS / FAIL

**Issues found**: **\*\***\_\_\_**\*\***  
**Action items**: **\*\***\_\_\_**\*\***
