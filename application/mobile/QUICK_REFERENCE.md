# 🚀 Quick Accessibility Reference

## Import These in Every Screen

```tsx
import {colors, spacing, typography} from '../utils/theme';
import {MIN_TOUCH_TARGET} from '../utils/accessibility';
```

## Color Replacements (Quick Reference)

| ❌ Old                    | ✅ New                 | When                    |
| ------------------------- | ---------------------- | ----------------------- |
| `#FFFFFF`, `'white'`      | `colors.background`    | Background color        |
| `#000000`, `'black'`      | `colors.textPrimary`   | Primary text            |
| `'gray'`, `#757575`       | `colors.textSecondary` | Secondary/hint text     |
| `#EEEEEE`                 | `colors.lightGray`     | Borders, disabled       |
| `#4CAF50`                 | `colors.primary`       | Brand color (updated!)  |
| `colors.white` on buttons | `colors.textOnPrimary` | Text on colored buttons |

## Typography Replacements

```tsx
// ❌ Don't use fixed sizes
fontSize: 32,
fontSize: 24,
fontSize: 16,

// ✅ Use typography variants
...typography.h1,     // 32sp, scales to 64sp
...typography.h2,     // 24sp, scales to 48sp
...typography.h3,     // 20sp, scales to 40sp
...typography.body,   // 16sp, scales to 32sp
...typography.caption, // 14sp, scales to 28sp
...typography.button, // 16sp, scales to 32sp
```

## Button Quick Fix

```tsx
// ❌ Before
const styles = StyleSheet.create({
  button: {
    height: 40,
    backgroundColor: '#4CAF50',
    padding: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

// ✅ After
const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET, // 44pt iOS / 48dp Android
    minWidth: MIN_TOUCH_TARGET,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  buttonText: {
    color: colors.textOnPrimary,
    ...typography.button,
  },
});
```

## Text Input Quick Fix

```tsx
// ❌ Before
<TextInput
  style={{
    height: 40,
    borderColor: 'gray',
    fontSize: 14,
  }}
  placeholder="Email"
/>

// ✅ After
<TextInput
  style={{
    ...commonStyles.input, // Includes MIN_TOUCH_TARGET
    borderColor: colors.lightGray,
    color: colors.textPrimary,
  }}
  placeholder="Email"
  placeholderTextColor={colors.textDisabled}
  allowFontScaling={true}
  maxFontSizeMultiplier={2}
  accessibilityLabel="Email input"
/>
```

## Touchable Elements Quick Fix

```tsx
// ❌ Before
<TouchableOpacity
  style={{
    padding: 8,
    backgroundColor: '#4CAF50',
  }}
  onPress={handlePress}
>
  <Text style={{ color: 'white' }}>Tap Me</Text>
</TouchableOpacity>

// ✅ After
<TouchableOpacity
  style={{
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  }}
  onPress={handlePress}
  accessibilityLabel="Tap Me"
  accessibilityRole="button"
>
  <Text style={{ color: colors.textOnPrimary, ...typography.button }}>
    Tap Me
  </Text>
</TouchableOpacity>
```

## Accessibility Props Template

```tsx
<TouchableOpacity
  accessibilityLabel="Delete post" // What it is
  accessibilityHint="Double tap to delete" // What it does
  accessibilityRole="button" // What type
  accessible={true} // Enable a11y
>
  <Icon name="trash" />
</TouchableOpacity>
```

## Common Roles

- `button` - Buttons, touchable elements
- `text` - Static text
- `link` - Links
- `search` - Search inputs
- `image` - Images
- `header` - Headers
- `checkbox` - Checkboxes
- `radio` - Radio buttons

## Test Checklist (Copy for PRs)

```markdown
## Accessibility Checklist

- [ ] All colors use `colors.*` from theme
- [ ] All text uses `typography.*` styles
- [ ] All buttons have `minHeight: MIN_TOUCH_TARGET`
- [ ] All TouchableOpacity have accessibility labels
- [ ] Tested at 200% font size - no major issues
- [ ] All interactive elements easily tappable
```

## VS Code Snippets (Optional)

Add to your `.vscode/snippets.code-snippets`:

```json
{
  "Accessible Button": {
    "prefix": "abutton",
    "body": [
      "<TouchableOpacity",
      "  style={{",
      "    minHeight: MIN_TOUCH_TARGET,",
      "    minWidth: MIN_TOUCH_TARGET,",
      "    backgroundColor: colors.primary,",
      "    paddingHorizontal: spacing.md,",
      "    justifyContent: 'center',",
      "    alignItems: 'center',",
      "  }}",
      "  onPress={$1}",
      "  accessibilityLabel=\"$2\"",
      "  accessibilityRole=\"button\"",
      ">",
      "  <Text style={{ color: colors.textOnPrimary, ...typography.button }}>",
      "    $3",
      "  </Text>",
      "</TouchableOpacity>"
    ]
  }
}
```

## Need Help?

- 📖 **Full Guide**: See `ACCESSIBILITY_MIGRATION_GUIDE.md`
- 🧪 **Testing**: See `ACCESSIBILITY_TESTING.md`
- 🎨 **Colors**: All verified ratios in theme.ts
- ❓ **Questions**: Check existing updated screens (HomeScreen, LoginScreen)

## Updated Files to Reference

Examples of correct implementation:

- ✅ `src/screens/HomeScreen.tsx`
- ✅ `src/screens/auth/LoginScreen.tsx`
- ✅ `src/screens/auth/SignupScreen.tsx`
- ✅ `src/components/CustomTabBar.tsx`

Copy patterns from these! 🎯
