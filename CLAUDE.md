# IMPORTANT RULES

READ A LOT OF CODE BEFORE MAKING A DECISION AND STRICTLY OBEY TO API ENDPOINTS!!!
TEST EVERY FEATURE!!!
DONT LOOK AT ARCHIVE DIRECTORY AND DONT CHANGE ANY CODE IF ITS NOT UNDER MOBILE DIRECTORY!!!


## Project Overview

Zero Waste Challenge - A gamified sustainability platform. The mobile app is located in `/application/mobile/` and connects to the production backend at `https://zerowaste.ink`.

## Mobile Development Commands

```bash
cd application/mobile

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on platforms
npm run android
npm run ios

# Testing
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
npm test -- path/to/file    # Run specific test file

# Linting
npm run lint
```

## Mobile Architecture

### Entry Point and Providers
`App.tsx` wraps the app with providers in this order:
1. `SafeAreaProvider` - Safe area handling
2. `ThemeProvider` - Dark/light theme
3. `AuthProvider` - Authentication state
4. `AppNavigator` - Navigation

### Navigation Structure (`src/navigation/AppNavigator.tsx`)
- **Unauthenticated**: Auth stack (Login, Signup)
- **Authenticated (regular user)**: Bottom tabs (Home, Community, Challenges, Profile) + stack screens (Tips, Achievements, Leaderboard, OtherProfile)
- **Authenticated (admin)**: Admin panel with moderation screens

Screen names are defined in `src/hooks/useNavigation.ts` via `SCREEN_NAMES` constant.

### State Management
- **AuthContext** (`src/context/AuthContext.tsx`): Authentication state, login/logout, user data
- **ThemeContext** (`src/context/ThemeContext.tsx`): Dark/light theme toggle
- Token storage via AsyncStorage (`src/utils/storage.ts`)

### API Services (`src/services/api.ts`)
All backend communication goes through service objects. The base URL is configured via `.env` file (`API_URL`).

```typescript
import { authService, wasteService, postService, challengeService, tipService, achievementService, profileService, adminService } from '../services/api';
```

**Token handling**: JWT tokens are automatically attached via axios interceptors. Token refresh is handled automatically on 401 responses.

### Internationalization (`src/i18n/`)
Supports English, Turkish, Spanish, French, and Arabic (RTL). Use `useTranslation` hook:
```typescript
const { t } = useTranslation();
// Usage: t('home.title'), t('common.loading')
```

Translation files are in `src/i18n/locales/`.

## API Endpoints Reference

Backend: `https://zerowaste.ink`

### Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login/` | POST | No | Login with email/password, returns JWT tokens |
| `/signup/` | POST | No | Create account |
| `/me/` | GET | Yes | Get current user info |
| `/jwt/refresh/` | POST | No | Refresh access token |

### Waste Tracking
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/waste/get/` | GET | Yes | Get user's waste totals by type |
| `/api/waste/` | POST | Yes | Log waste (waste_type, amount in grams) |
| `/api/waste/leaderboard/` | GET | Yes | Get waste leaderboard |

Waste types: `PLASTIC`, `PAPER`, `GLASS`, `METAL`, `ELECTRONIC`, `OIL&FATS`, `ORGANIC`

### Posts & Community
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/posts/all/` | GET | No | Get all posts (paginated) |
| `/api/posts/create/` | POST | Yes | Create post (multipart: text, image) |
| `/api/posts/{id}/like/` | POST | Yes | Like a post |
| `/api/posts/{id}/dislike/` | POST | Yes | Dislike a post |
| `/api/posts/{id}/comments/` | GET | No | Get post comments |
| `/api/posts/{id}/comments/create/` | POST | Yes | Add comment |

### Challenges
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/challenges/` | GET | No | List all challenges (paginated) |
| `/api/challenges/` | POST | Yes | Create challenge |
| `/api/challenges/enrolled/` | GET | Yes | Get user's enrolled challenges |
| `/api/challenges/participate/` | POST | Yes | Join challenge |
| `/api/challenges/{id}/delete/` | DELETE | Yes | Delete challenge |

### Profile
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/profile/{username}/bio/` | GET | No | Get user bio |
| `/api/profile/{username}/bio/` | PUT | Yes | Update bio |
| `/api/profile/{username}/picture/` | GET | No | Get profile picture |
| `/api/profile/profile-picture/` | POST | Yes | Upload profile picture (multipart) |
| `/api/profile/{username}/waste-stats/` | GET | No | Get user's waste stats |
| `/api/profile/{username}/follow/` | POST | Yes | Follow user |
| `/api/profile/{username}/unfollow/` | POST | Yes | Unfollow user |

### Tips
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/tips/get_recent_tips` | GET | No | Get recent tips |
| `/api/tips/all` | GET | No | Get all tips |
| `/api/tips/create/` | POST | Yes | Create tip |
| `/api/tips/{id}/like/` | POST | Yes | Like tip |
| `/api/tips/{id}/dislike/` | POST | Yes | Dislike tip |

### Achievements & Badges
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/achievements/` | GET | Yes | Get user achievements |
| `/api/badges/` | GET | Yes | Get user badges |
| `/api/badges/leaderboard/` | GET | Yes | Badge leaderboard (top 50) |
| `/api/badges/check/` | POST | Yes | Check for new badges |

### Admin (requires admin auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/reports/` | GET | Get moderation reports |
| `/api/admin/reports/{id}/moderate/` | POST | Moderate content |

## Testing Conventions

Tests are co-located in `__tests__` directories. Jest config is in `jest.config.js`.

```bash
# Run a specific test
npm test -- src/services/__tests__/api.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

Key mocks are set up in `jest.setup.js`:
- AsyncStorage
- Navigation hooks
- Axios
- Expo modules
- Chart components

## Environment Configuration

Copy `.env.example` to `.env`:
```
API_URL=https://zerowaste.ink
```

For local backend development:
```
API_URL=http://localhost:8000
```

## Important Notes

- Do not modify files in `/archive/` directory
- All API responses may be paginated with `{ count, next, previous, results }` format
- Image uploads use FormData (multipart/form-data)
- Profile pictures: use `getProfilePictureUrl(username)` helper
- Post images: use `getPostImageUrl(imageUrl)` helper
