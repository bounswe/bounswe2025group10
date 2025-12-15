# Mobile Design Document Skill

When this skill is invoked, generate a comprehensive mobile design document for the Zero Waste Challenge app.

## Context

This is a **React Native (Expo)** mobile app for a gamified sustainability platform. The app connects to a Django REST backend at `https://zerowaste.ink`.

### Current Tech Stack
- **Framework**: React Native 0.81.4 with Expo 54
- **Language**: TypeScript
- **Navigation**: React Navigation 7 (bottom tabs + native stack)
- **State**: Context API (AuthContext, ThemeContext)
- **HTTP Client**: Axios with JWT interceptors
- **Storage**: AsyncStorage
- **Charts**: react-native-chart-kit
- **i18n**: i18next (EN, TR, ES, FR, AR with RTL support)

### Current Screens
- **Auth**: LoginScreen, SignupScreen
- **Main Tabs**: HomeScreen, CommunityScreen, ChallengesScreen, ProfileScreen
- **Stack Screens**: TipsScreen, AchievementsScreen, LeaderboardScreen, OtherUserProfileScreen
- **Admin**: AdminPanel, PostModeration, CommentModeration, ChallengeModeration, UserModeration

### Key Features
- Waste tracking with CO2 impact calculation
- Community posts with likes/comments
- Challenges with progress tracking
- Tips and educational content
- Achievements and badges system
- Global leaderboards
- Weather API integration
- Dark/light theme support

---

## Design Principles (MUST FOLLOW)

All mobile design documents must incorporate these design principles to create a visually polished, modern app experience.

### 1. Visual Hierarchy & Typography Scale

**Problem**: Current UI has flat visual hierarchy - everything has similar visual weight.

**Solution**:
```typescript
// Enhanced typography scale with proper contrast
const typography = {
  // Display - Hero sections, welcome screens
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, lineHeight: 41 },

  // Headings
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: 0, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', letterSpacing: 0.15, lineHeight: 24 },

  // Body text
  bodyLarge: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },

  // Labels & captions
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
```

### 2. Color System with Accent Colors

**Problem**: Green-heavy monotone palette lacks visual interest.

**Solution**: Introduce semantic and accent colors
```typescript
const colors = {
  // Primary brand
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',

  // Accent colors for variety (use sparingly)
  accent: '#FF6B35',        // Warm orange for CTAs, achievements
  accentSecondary: '#5C6BC0', // Indigo for info, links

  // Semantic colors
  success: '#43A047',
  warning: '#FB8C00',
  error: '#E53935',
  info: '#1E88E5',

  // Waste type colors (for visual differentiation)
  wasteColors: {
    plastic: '#2196F3',    // Blue
    paper: '#8D6E63',      // Brown
    glass: '#00BCD4',      // Cyan
    metal: '#78909C',      // Blue-grey
    electronic: '#7E57C2', // Purple
    oil: '#FFB300',        // Amber
    organic: '#66BB6A',    // Light green
  },

  // Neutrals with more steps
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};
```

### 3. Elevation & Depth System

**Problem**: Cards look flat with minimal shadows.

**Solution**: Consistent elevation scale
```typescript
const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};
```

### 4. Border Radius Scale

**Problem**: Everything uses 8px, no visual variety.

**Solution**: Purposeful radius scale
```typescript
const borderRadius = {
  none: 0,
  xs: 4,      // Chips, small badges
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards, containers
  lg: 16,     // Modal corners, large cards
  xl: 24,     // Bottom sheets, floating action buttons
  full: 9999, // Pills, avatars
};
```

### 5. Spacing & Layout

**Problem**: Inconsistent spacing, cramped layouts.

**Solution**: 8px grid system with breathing room
```typescript
const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Screen padding should be generous
const screenPadding = {
  horizontal: spacing.lg,  // 24px sides
  vertical: spacing.md,    // 16px top/bottom
};

// Card internal padding
const cardPadding = spacing.lg; // 24px internal spacing
```

### 6. Component-Specific Improvements

#### Cards
```typescript
const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  ...elevation.md,
  // Add subtle border for definition in light mode
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.04)',
};
```

#### Buttons - Three-tier hierarchy
```typescript
// Primary - main actions
const buttonPrimary = {
  backgroundColor: colors.primary,
  borderRadius: borderRadius.sm,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xl,
  ...elevation.sm,
};

// Secondary - supporting actions
const buttonSecondary = {
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: colors.primary,
  borderRadius: borderRadius.sm,
};

// Tertiary/Ghost - low-emphasis actions
const buttonTertiary = {
  backgroundColor: 'transparent',
  paddingVertical: spacing.sm,
};
```

#### Input Fields
```typescript
const inputStyle = {
  backgroundColor: colors.neutral[50],
  borderRadius: borderRadius.sm,
  borderWidth: 1.5,
  borderColor: colors.neutral[300],
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  // Focus state
  // borderColor: colors.primary,
};
```

### 7. Iconography System

**Problem**: Using emoji instead of proper icons.

**Solution**: Use consistent icon library
```typescript
// Use @expo/vector-icons with consistent style
// Recommended: Ionicons or MaterialCommunityIcons

// Icon sizes
const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

// Replace emoji with icons:
// 👍 → <Ionicons name="thumbs-up-outline" />
// 👎 → <Ionicons name="thumbs-down-outline" />
// ⚠️ → <Ionicons name="warning-outline" />
// 🔍 → <Ionicons name="search-outline" />
```

### 8. Motion & Micro-interactions

**Solution**: Add subtle animations using React Native Reanimated
```typescript
// Button press feedback
const buttonPressAnimation = {
  scale: 0.97,
  duration: 100,
};

// Card entry animations
const cardEntryAnimation = {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 300,
  delay: index * 50, // Stagger
};

// Success feedback
const successAnimation = {
  scale: [1, 1.2, 1],
  duration: 200,
};
```

### 9. Empty States & Loading

**Problem**: Basic loading spinners and empty states.

**Solution**: Delightful empty states
```typescript
// Empty state component
const EmptyState = {
  illustration: true,  // Add relevant illustration
  title: 'bold, encouraging',
  subtitle: 'helpful, actionable',
  action: 'primary button to resolve',
};

// Skeleton loading instead of spinners
const SkeletonCard = {
  backgroundColor: colors.neutral[200],
  borderRadius: borderRadius.md,
  animation: 'shimmer',
};
```

### 10. Visual Feedback States

Every interactive element needs clear states:
```typescript
const interactiveStates = {
  default: { opacity: 1 },
  pressed: { opacity: 0.7, scale: 0.98 },
  disabled: { opacity: 0.4 },
  loading: { opacity: 0.7 },
  success: { backgroundColor: colors.success + '20' },
  error: { borderColor: colors.error },
};
```

### 11. Image & Avatar Treatment

```typescript
// Avatar styles
const avatar = {
  small: { width: 32, height: 32, borderRadius: 16 },
  medium: { width: 48, height: 48, borderRadius: 24 },
  large: { width: 80, height: 80, borderRadius: 40 },
  // Add border for visibility
  borderWidth: 2,
  borderColor: colors.white,
};

// Post images
const postImage = {
  borderRadius: borderRadius.md,
  aspectRatio: 16/9, // or 4/3
  resizeMode: 'cover',
};
```

### 12. Header & Navigation

```typescript
// Modern header style
const headerStyle = {
  backgroundColor: colors.white,
  elevation: 0,          // Remove shadow
  borderBottomWidth: 1,
  borderBottomColor: colors.neutral[200],
  // Or use blur for modern look
  // backgroundColor: 'rgba(255,255,255,0.9)',
  // backdropFilter: 'blur(10px)',
};

// Tab bar
const tabBarStyle = {
  backgroundColor: colors.white,
  borderTopWidth: 0,
  ...elevation.lg,
  paddingBottom: 8,
  height: 65,
};
```

### 13. Gamification Visual Enhancements

For a sustainability gamification app, add:
```typescript
// Achievement unlocked animation
const achievementStyle = {
  gradient: ['#FFD700', '#FFA000'], // Gold gradient
  glow: true,
  confetti: true,
};

// Progress indicators
const progressBar = {
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.neutral[200],
  progressColor: colors.primary,
  animated: true,
};

// Streak/milestone celebrations
const milestoneStyle = {
  scale: 1.1,
  particleEffect: true,
};
```

### 14. Dark Mode Refinements

```typescript
const darkColors = {
  background: '#0F0F0F',     // True black for OLED
  surface: '#1A1A1A',        // Slightly lighter for cards
  surfaceElevated: '#242424', // Even lighter for modals

  // Reduce primary brightness for dark mode
  primary: '#66BB6A',        // Lighter green

  // Softer whites
  textPrimary: '#F5F5F5',    // Not pure white
  textSecondary: '#A0A0A0',
};
```

### 15. Quick Wins Checklist

Apply these immediately for visual improvement:
- [ ] Increase card padding from 16px to 24px
- [ ] Add elevation.md to all cards
- [ ] Use borderRadius.md (12px) for cards, borderRadius.sm (8px) for buttons
- [ ] Replace emoji with proper icons
- [ ] Add 24px horizontal screen padding
- [ ] Use proper typography hierarchy (h1 for titles, body for content)
- [ ] Add waste-type colors to charts
- [ ] Implement skeleton loading
- [ ] Add pressed states to all buttons
- [ ] Use accent color for achievements/gamification elements

---

## Styling Framework Setup

Choose ONE of the following styling approaches for consistent, maintainable UI code.

### Option A: NativeWind (Recommended for Tailwind users)

NativeWind brings Tailwind CSS utility classes to React Native. Best for rapid UI development.

#### Installation

```bash
cd application/mobile
npm install nativewind tailwindcss
npx tailwindcss init
```

#### Configuration

**1. Update `tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#2E7D32',
          light: '#4CAF50',
          dark: '#1B5E20',
        },
        accent: {
          DEFAULT: '#FF6B35',
          secondary: '#5C6BC0',
        },
        // Waste type colors
        waste: {
          plastic: '#2196F3',
          paper: '#8D6E63',
          glass: '#00BCD4',
          metal: '#78909C',
          electronic: '#7E57C2',
          oil: '#FFB300',
          organic: '#66BB6A',
        },
        // Semantic
        success: '#43A047',
        warning: '#FB8C00',
        error: '#E53935',
        info: '#1E88E5',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
```

**2. Update `babel.config.js`:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**3. Create `global.css` in project root:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**4. Import in `App.tsx`:**
```typescript
import "./global.css";
```

**5. Add TypeScript support - create `nativewind-env.d.ts`:**
```typescript
/// <reference types="nativewind/types" />
```

#### Usage Examples

```tsx
// Before (StyleSheet)
<View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
  <Text style={[styles.title, { color: colors.primary }]}>Title</Text>
  <Text style={[styles.body, { color: colors.textSecondary }]}>Body text</Text>
</View>

// After (NativeWind)
<View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 shadow-md">
  <Text className="text-primary font-bold text-xl mb-2">Title</Text>
  <Text className="text-neutral-600 dark:text-neutral-400">Body text</Text>
</View>
```

**Common patterns:**
```tsx
// Card
<View className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-md border border-black/5">

// Primary Button
<TouchableOpacity className="bg-primary py-4 px-8 rounded-lg shadow-sm active:opacity-80">
  <Text className="text-white font-semibold text-center">Button</Text>
</TouchableOpacity>

// Secondary Button
<TouchableOpacity className="border-2 border-primary py-4 px-8 rounded-lg">
  <Text className="text-primary font-semibold text-center">Button</Text>
</TouchableOpacity>

// Input
<TextInput className="bg-neutral-50 border border-neutral-300 rounded-lg py-4 px-4 text-neutral-900" />

// Avatar
<Image className="w-12 h-12 rounded-full border-2 border-white" />

// Badge/Chip
<View className="bg-primary/10 px-3 py-1 rounded-full">
  <Text className="text-primary text-sm font-medium">Badge</Text>
</View>
```

**Dark mode:**
```tsx
// Automatically switches based on system preference
<View className="bg-white dark:bg-neutral-900">
  <Text className="text-neutral-900 dark:text-white">Adapts to theme</Text>
</View>
```

---

### Option B: Shopify Restyle (Type-safe design tokens)

Restyle provides type-safe theming that works well with the existing token pattern. Best for teams wanting strict design system enforcement.

#### Installation

```bash
cd application/mobile
npm install @shopify/restyle
```

#### Configuration

**1. Create `src/theme/restyle.ts`:**
```typescript
import { createTheme, createBox, createText, createRestyleComponent, backgroundColor, spacing, layout, border, shadow } from '@shopify/restyle';

const palette = {
  // Primary
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',

  // Accent
  accent: '#FF6B35',
  accentSecondary: '#5C6BC0',

  // Semantic
  success: '#43A047',
  warning: '#FB8C00',
  error: '#E53935',
  info: '#1E88E5',

  // Waste types
  wastePlastic: '#2196F3',
  wastePaper: '#8D6E63',
  wasteGlass: '#00BCD4',
  wasteMetal: '#78909C',
  wasteElectronic: '#7E57C2',
  wasteOil: '#FFB300',
  wasteOrganic: '#66BB6A',

  // Neutrals
  white: '#FFFFFF',
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#EEEEEE',
  neutral300: '#E0E0E0',
  neutral400: '#BDBDBD',
  neutral500: '#9E9E9E',
  neutral600: '#757575',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',
  black: '#000000',
};

const theme = createTheme({
  colors: {
    // Semantic mappings
    mainBackground: palette.white,
    cardBackground: palette.white,
    primaryCardBackground: palette.primary,

    textPrimary: palette.neutral900,
    textSecondary: palette.neutral600,
    textMuted: palette.neutral500,
    textOnPrimary: palette.white,

    primary: palette.primary,
    primaryLight: palette.primaryLight,
    accent: palette.accent,

    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    border: palette.neutral300,
    borderLight: palette.neutral200,

    // Waste colors
    ...palette,
  },

  spacing: {
    none: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadii: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  textVariants: {
    defaults: {
      color: 'textPrimary',
      fontSize: 15,
      lineHeight: 22,
    },
    display: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: 41,
      color: 'textPrimary',
    },
    h1: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.3,
      lineHeight: 34,
      color: 'textPrimary',
    },
    h2: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
      color: 'textPrimary',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.15,
      lineHeight: 24,
      color: 'textPrimary',
    },
    bodyLarge: {
      fontSize: 17,
      lineHeight: 24,
      color: 'textPrimary',
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: 'textPrimary',
    },
    bodySmall: {
      fontSize: 13,
      lineHeight: 18,
      color: 'textSecondary',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: 'textSecondary',
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      color: 'textMuted',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: 'textOnPrimary',
    },
  },

  // Card variants
  cardVariants: {
    defaults: {
      backgroundColor: 'cardBackground',
      borderRadius: 'md',
      padding: 'lg',
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    elevated: {
      backgroundColor: 'cardBackground',
      borderRadius: 'lg',
      padding: 'lg',
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    flat: {
      backgroundColor: 'cardBackground',
      borderRadius: 'md',
      padding: 'lg',
      borderWidth: 1,
      borderColor: 'borderLight',
    },
  },

  // Button variants
  buttonVariants: {
    defaults: {
      paddingVertical: 'md',
      paddingHorizontal: 'xl',
      borderRadius: 'sm',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: 'primary',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: 'primary',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: 'error',
    },
  },
});

// Dark theme
export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    mainBackground: '#0F0F0F',
    cardBackground: '#1A1A1A',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#757575',
    border: palette.neutral700,
    borderLight: palette.neutral800,
    primary: '#66BB6A',
  },
};

export type Theme = typeof theme;
export const Box = createBox<Theme>();
export const Text = createText<Theme>();

// Card component with variants
export const Card = createRestyleComponent<
  React.ComponentProps<typeof Box> & { variant?: keyof Theme['cardVariants'] },
  Theme
>([backgroundColor, spacing, layout, border, shadow], Box);

export default theme;
```

**2. Wrap app with ThemeProvider in `App.tsx`:**
```typescript
import { ThemeProvider } from '@shopify/restyle';
import theme, { darkTheme } from './src/theme/restyle';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      {/* Rest of app */}
    </ThemeProvider>
  );
}
```

#### Usage Examples

```tsx
import { Box, Text, Card } from '../theme/restyle';

// Card with elevation
<Card variant="elevated" marginBottom="md">
  <Text variant="h2" marginBottom="sm">Title</Text>
  <Text variant="body" color="textSecondary">Body text here</Text>
</Card>

// Flat card
<Card variant="flat">
  <Text variant="bodySmall">Flat card content</Text>
</Card>

// Custom box with theme tokens
<Box
  backgroundColor="cardBackground"
  padding="lg"
  borderRadius="md"
  marginHorizontal="lg"
>
  <Text variant="h3" color="primary">Heading</Text>
</Box>

// Button
<Box
  backgroundColor="primary"
  paddingVertical="md"
  paddingHorizontal="xl"
  borderRadius="sm"
  alignItems="center"
>
  <Text variant="button">Press Me</Text>
</Box>

// Avatar
<Box
  width={48}
  height={48}
  borderRadius="full"
  backgroundColor="neutral200"
  overflow="hidden"
>
  <Image source={...} style={{ width: '100%', height: '100%' }} />
</Box>

// Badge
<Box
  backgroundColor="primaryLight"
  paddingHorizontal="sm"
  paddingVertical="xs"
  borderRadius="full"
>
  <Text variant="caption" color="textOnPrimary">New</Text>
</Box>
```

**Responsive values:**
```tsx
<Box
  padding={{
    phone: 'md',
    tablet: 'xl',
  }}
>
  <Text variant="h1">Responsive</Text>
</Box>
```

---

### Option C: Keep StyleSheet (Enhanced)

If you prefer not to add a new dependency, enhance the existing approach.

**1. Create `src/theme/index.ts` consolidating all tokens:**
```typescript
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './elevation';
export * from './borderRadius';

// Pre-composed styles
export const cardStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...elevation.md,
  },
  // ... more variants
});

export const buttonStyles = StyleSheet.create({
  primary: { /* ... */ },
  secondary: { /* ... */ },
  ghost: { /* ... */ },
});
```

**2. Create reusable components:**
```typescript
// src/components/ui/Card.tsx
export const Card: React.FC<CardProps> = ({ variant = 'default', children, style }) => (
  <View style={[cardStyles[variant], style]}>
    {children}
  </View>
);

// src/components/ui/Button.tsx
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', title, onPress }) => (
  <TouchableOpacity style={buttonStyles[variant]} onPress={onPress}>
    <Text style={buttonTextStyles[variant]}>{title}</Text>
  </TouchableOpacity>
);
```

---

### Framework Comparison

| Feature | NativeWind | Restyle | StyleSheet |
|---------|------------|---------|------------|
| Learning curve | Low (if know Tailwind) | Medium | None |
| Type safety | Partial | Full | Manual |
| Bundle size | ~20KB | ~15KB | 0KB |
| Dark mode | Built-in | Built-in | Manual |
| Responsive | Yes | Yes | Manual |
| DevX | Excellent | Good | Basic |
| Best for | Rapid development | Design system | Simple apps |

### Recommendation for Zero Waste Challenge

**Use NativeWind** because:
1. Rapid iteration for UI improvements
2. Easy dark mode with `dark:` prefix
3. Utility classes reduce style duplication
4. Familiar to web developers
5. Great for the visual refresh you want

---

## Design Document Template

When generating a mobile design document, use this structure:

```markdown
# Mobile Design Document: [Feature Name]

## 1. Overview
- **Feature**: Brief description
- **Target Platform**: iOS / Android / Both
- **Priority**: High / Medium / Low
- **Estimated Complexity**: Simple / Moderate / Complex

## 2. User Stories
- As a [user type], I want to [action] so that [benefit]
- List all relevant user stories

## 3. Screen Designs

### 3.1 [Screen Name]
**Purpose**: What this screen does

**Layout**:
- Header: [description]
- Body: [description]
- Footer/Actions: [description]

**Components**:
- List all UI components needed
- Note reusable components from existing codebase

**States**:
- Loading state
- Empty state
- Error state
- Success state

### 3.2 [Additional Screens...]

## 4. Navigation Flow
- Describe how users navigate to/from this feature
- Include navigation stack changes
- Note any deep linking requirements

## 5. Data Models

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/...` | GET/POST | Yes/No | Description |

### TypeScript Interfaces
```typescript
interface FeatureData {
  // Define data structures
}
```

## 6. State Management
- Local state (useState)
- Context state (if needed)
- AsyncStorage persistence (if needed)

## 7. Component Architecture

```
FeatureScreen/
├── FeatureScreen.tsx (main screen)
├── components/
│   ├── FeatureCard.tsx
│   └── FeatureList.tsx
└── hooks/
    └── useFeature.ts
```

## 8. Accessibility Requirements
- Touch targets: minimum 44pt (iOS) / 48dp (Android)
- Color contrast: WCAG 2.1 AA compliance
- Screen reader labels for all interactive elements
- Support for font scaling up to 200%

## 9. Internationalization
- All user-facing strings must use i18next
- Add translations to: en.json, tr.json, es.json, fr.json, ar.json
- Support RTL layout for Arabic

## 10. Error Handling
- Network errors: Show retry option
- Validation errors: Inline feedback
- Server errors: User-friendly messages

## 11. Testing Plan
- Unit tests for hooks and utilities
- Component tests for UI logic
- Integration tests for API calls
- Test files go in `__tests__/` directories

## 12. Implementation Checklist
- [ ] Create screen component
- [ ] Implement API service methods
- [ ] Add navigation routes
- [ ] Add translations
- [ ] Write unit tests
- [ ] Add accessibility labels
- [ ] Test on iOS
- [ ] Test on Android
```

## Instructions

When the user asks to create a mobile design doc:

1. **Ask clarifying questions** if the feature is not well-defined:
   - What specific functionality should this feature have?
   - Who are the target users (regular users, admins, or both)?
   - Are there any existing screens to reference?
   - Any specific design constraints or preferences?

2. **Research the codebase** before writing:
   - Check existing similar features for patterns
   - Review the API service layer (`src/services/api.ts`)
   - Check current navigation structure (`src/navigation/AppNavigator.tsx`)
   - Review component patterns in `src/components/`

3. **Generate a complete document** following the template above

4. **Save the document** to `docs/mobile/` directory with naming convention:
   - `design-[feature-name].md`
   - Example: `design-notifications.md`

## Example Prompt Responses

**User**: "Create a design doc for push notifications"

**Response**: Generate a full design document covering:
- Notification permissions flow
- Notification settings screen
- In-app notification center
- Push token registration API
- Notification preference storage
- Testing with Expo push notifications

**User**: "Design doc for recycling center map"

**Response**: Generate a full design document covering:
- Map integration (react-native-maps)
- Location permissions
- Recycling center data model
- Search and filter functionality
- Directions integration
- Offline caching considerations
