# Mobile App - API Architecture Documentation

## Overview

This document explains how the Zero Waste Challenge mobile app (React Native with Expo) communicates with the backend API.

---

## Environment Configuration

### API URL Setup

The backend API URL is configured in the `.env` file:

```env
API_URL=https://zerowaste.ink
```

**Important Notes:**
- The `.env` file is NOT committed to git (listed in `.gitignore`)
- Use `.env.example` as a template for creating your `.env` file
- The `react-native-dotenv` Babel plugin loads this at **build time**, not runtime
- Changing `.env` requires restarting the Metro bundler and clearing cache

### Environment Variable Access Pattern

**❌ WRONG - Don't do this in screens:**
```typescript
// Don't import API_URL directly in screens
import { API_URL } from '@env';
const url = `${API_URL}/api/profile/${username}/picture/`;
```

**✅ CORRECT - Import utilities from api.ts:**
```typescript
// Import helper functions from the service layer
import { getProfilePictureUrl } from '../services/api';
const url = getProfilePictureUrl(username);
```

**Why?**
- Keeps API_URL encapsulated in one place (Single Responsibility)
- Makes testing easier (mock one module, not multiple)
- Prevents URL construction errors
- Makes future API changes easier to manage

---

## Service Layer Architecture

### Core API Client (`src/services/api.ts`)

The axios instance is configured with:
- **Base URL**: From `.env` file
- **Timeout**: 10 seconds
- **Request Interceptor**: Automatically adds JWT token from AsyncStorage
- **Response Interceptor**: Logs errors with detailed information

```typescript
const api = axios.create({
  baseURL: API_URL,  // Internal only
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
```

### Available Services

#### 1. **authService** - Authentication
```typescript
import { authService } from '../services/api';

// Login
const response = await authService.login({ email, password });
// Returns: { message, token: { access, refresh }, isAdmin, username }

// Signup
const response = await authService.signup({ email, username, password });

// Get current user info
const userInfo = await authService.getUserInfo();

// Refresh token
const newToken = await authService.refreshToken(refreshToken);
```

#### 2. **wasteService** - Waste Tracking
```typescript
import { wasteService } from '../services/api';

// Get user's waste statistics
const wastes = await wasteService.getUserWastes();

// Log new waste entry
const result = await wasteService.addUserWaste('PLASTIC', 2.5);
```

#### 3. **tipService** - Tips & Recommendations
```typescript
import { tipService } from '../services/api';

// Get all tips (paginated)
const tips = await tipService.getAllTips();

// Get recent tips (no auth required)
const recentTips = await tipService.getRecentTips();

// Create new tip
const newTip = await tipService.createTip(title, description);

// React to tips
await tipService.likeTip(tipId);
await tipService.dislikeTip(tipId);

// Report inappropriate tip
await tipService.reportTip(tipId, 'SPAM', 'Description of issue');
```

#### 4. **challengeService** - Challenges (INCOMPLETE - needs expansion)
```typescript
import { challengeService } from '../services/api';

// Delete challenge (only method currently implemented)
await challengeService.deleteChallenge(challengeId);
```

**Missing methods that need to be added:**
- `getChallenges()` - Currently screens call `api.get('/api/challenges/')` directly
- `getEnrolledChallenges()` - Currently screens call `api.get('/api/challenges/enrolled/')` directly
- `createChallenge()` - Currently screens call `api.post('/api/challenges/')` directly
- `joinChallenge()` - Currently screens call `api.post('/api/challenges/participate/')` directly
- `leaveChallenge()` - Currently screens call `api.delete('/api/challenges/participate/{id}/')` directly

#### 5. **achievementService** - User Achievements
```typescript
import { achievementService } from '../services/api';

const achievements = await achievementService.getUserAchievements();
```

#### 6. **leaderboardService** - Rankings
```typescript
import { leaderboardService } from '../services/api';

// Get global leaderboard
const leaderboard = await leaderboardService.getLeaderboard();

// Get user bio (public)
const bio = await leaderboardService.getUserBio(username);
```

#### 7. **profileService** - Profile Management
```typescript
import { profileService } from '../services/api';

// Upload profile picture (multipart/form-data)
const formData = new FormData();
formData.append('image', imageFile);
await profileService.uploadProfilePicture(formData);

// Update bio
await profileService.updateBio(username, 'My new bio');
```

#### 8. **profilePublicService** - Public Profile Access
```typescript
import { profilePublicService } from '../services/api';

// Get public user bio (no auth required)
const bio = await profilePublicService.getUserBio(username);
```

#### 9. **adminService** - Content Moderation
```typescript
import { adminService } from '../services/api';

// Get all reports (optional filter by content type)
const allReports = await adminService.getReports();
const tipReports = await adminService.getReports('tips');

// Moderate content
await adminService.moderateContent(reportId, 'approve');
await adminService.moderateContent(reportId, 'delete');
```

#### 10. **weatherService** - Weather Data (External API)
```typescript
import { weatherService } from '../services/api';

// Get current weather (Open-Meteo API - no key required)
const weather = await weatherService.getCurrentWeather(latitude, longitude);
```

---

## URL Construction Utilities

### Profile Pictures

**Helper function (provided by api.ts):**
```typescript
import { getProfilePictureUrl } from '../services/api';

// Usage in screens
const imageUrl = getProfilePictureUrl(username);

// Renders as: https://zerowaste.ink/api/profile/{username}/picture/
```

**In Image components:**
```typescript
<Image
  source={{ uri: getProfilePictureUrl(username) }}
  style={styles.avatar}
  defaultSource={require('../assets/profile_placeholder.png')}
/>
```

### Post Images

Post images are returned directly from the API in the `image_url` field:
```typescript
const response = await api.post('/api/posts/create/', formData);
const imageUrl = response.data.image_url;  // Full URL already constructed
```

---

## Authentication Flow

### Token Management

1. **Login Process:**
   ```typescript
   // LoginScreen.tsx
   const response = await authService.login({ email, password });

   // Store tokens in AsyncStorage
   await storage.setToken(response.token.access);
   await storage.setRefreshToken(response.token.refresh);

   // Update auth context
   await login(response.token.access, response.token.refresh);
   ```

2. **Automatic Token Injection:**
   - Every API request automatically includes `Authorization: Bearer {token}` header
   - Handled by axios request interceptor in `api.ts`
   - Token retrieved from AsyncStorage before each request

3. **Token Refresh:**
   - Manual refresh via `authService.refreshToken(refreshToken)`
   - No automatic refresh interceptor (should be added)

4. **Logout Process:**
   ```typescript
   // Clear tokens from AsyncStorage
   await storage.clearTokens();

   // Update auth context
   logout();
   ```

---

## Error Handling Patterns

### Service-Level Error Handling

All services should follow this pattern:

```typescript
try {
  const response = await someService.getData();
  setData(response.data);
} catch (error: any) {
  console.error('Error:', error);
  Alert.alert('Error', error.response?.data?.detail || 'Failed to load data');
} finally {
  setLoading(false);
}
```

### Response Interceptor Logging

The axios response interceptor logs:
- ✅ Success: HTTP status + URL
- ❌ Response error: Status code, response data, URL
- ❌ Network error: No response received details
- ❌ Setup error: Request configuration issues

---

## Common Issues & Solutions

### Issue 1: "API_URL is undefined"

**Cause:** `.env` file missing or Metro bundler not restarted after changes

**Solution:**
```bash
# 1. Ensure .env file exists with API_URL
cp .env.example .env

# 2. Clear Metro cache and restart
npx expo start --clear
```

### Issue 2: "Network request failed"

**Possible causes:**
1. Backend server is down
2. Wrong API_URL in `.env`
3. CORS issues (shouldn't happen in mobile apps)
4. Firewall/network blocking requests

**Solution:**
```bash
# Test backend connectivity
curl https://zerowaste.ink/api/docs

# For local development, use correct URL:
# - Android emulator: http://10.0.2.2:8000
# - Physical device: http://YOUR_COMPUTER_IP:8000
# - iOS simulator: http://localhost:8000
```

### Issue 3: "401 Unauthorized"

**Cause:** Token expired or not included in request

**Solution:**
```typescript
// Check if token exists
const token = await storage.getToken();
console.log('Token exists:', !!token);

// If token exists but still 401, refresh it
const refreshToken = await storage.getRefreshToken();
const newTokens = await authService.refreshToken(refreshToken);
await storage.setToken(newTokens.access);
```

### Issue 4: Images not loading

**Common mistakes:**
```typescript
// ❌ Wrong - missing protocol
const url = 'zerowaste.ink/api/profile/user/picture/';

// ❌ Wrong - constructing URL manually
const url = `${API_URL}/api/profile/${user}/picture/`;

// ✅ Correct - use helper function
import { getProfilePictureUrl } from '../services/api';
const url = getProfilePictureUrl(username);
```

---

## API Endpoints Reference

All endpoints relative to `https://zerowaste.ink`

### Authentication (No JWT required for login/signup)
- `POST /login/` - Authenticate user
- `POST /signup/` - Register new user
- `GET /me/` - Get current user (JWT required)
- `POST /jwt/refresh/` - Refresh access token

### Posts (JWT required)
- `GET /api/posts/all/` - List all posts
- `POST /api/posts/create/` - Create post
- `POST /api/posts/{id}/like/` - Like post
- `POST /api/posts/{id}/dislike/` - Dislike post
- `GET /api/posts/{id}/comments/` - Get comments
- `POST /api/posts/{id}/comments/create/` - Add comment

### Challenges (JWT required)
- `GET /api/challenges/` - List challenges
- `POST /api/challenges/` - Create challenge
- `GET /api/challenges/enrolled/` - User's challenges
- `POST /api/challenges/participate/` - Join challenge
- `DELETE /api/challenges/participate/{id}/` - Leave challenge
- `DELETE /api/challenges/{id}/delete/` - Delete challenge

### Waste (JWT required)
- `GET /api/waste/get/` - User waste stats
- `POST /api/waste/` - Log waste entry
- `GET /api/waste/leaderboard/` - Global rankings

### Tips (Some public, some JWT required)
- `GET /api/tips/all/` - All tips (JWT)
- `GET /api/tips/get_recent_tips` - Recent tips (Public)
- `POST /api/tips/create/` - Create tip (JWT)
- `POST /api/tips/{id}/like/` - Like tip (JWT)
- `POST /api/tips/{id}/dislike/` - Dislike tip (JWT)

### Profile (JWT required except bio read)
- `GET /api/profile/{username}/bio/` - Get bio (Public)
- `PUT /api/profile/{username}/bio/` - Update bio (JWT)
- `GET /api/profile/{username}/picture/` - Get picture (Public)
- `POST /api/profile/profile-picture/` - Upload picture (JWT)

### Achievements (JWT required)
- `GET /api/achievements/` - User achievements

### Admin (JWT required + admin role)
- `GET /api/admin/reports/` - All reports
- `POST /api/admin/reports/{id}/moderate/` - Moderate content

---

## Best Practices

### DO ✅
- Use service layer functions instead of direct `api.get()/api.post()` calls
- Import URL helper functions from `api.ts`
- Handle errors with user-friendly Alert messages
- Use pull-to-refresh on list screens
- Show loading states during API calls
- Clear sensitive data on logout

### DON'T ❌
- Import `API_URL` from `@env` in screens
- Construct URLs manually in components
- Make direct axios calls bypassing service layer
- Ignore error responses
- Store tokens in state (use AsyncStorage)
- Expose sensitive data in logs (production)

---

## Testing

### Mocking API Services

```typescript
// In test files
jest.mock('../services/api', () => ({
  authService: {
    login: jest.fn(),
  },
  getProfilePictureUrl: jest.fn((username) =>
    `http://localhost:8000/api/profile/${username}/picture/`
  ),
}));
```

### Manual API Testing

```bash
# Test login endpoint
curl -X POST https://zerowaste.ink/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test authenticated endpoint
curl https://zerowaste.ink/api/waste/get/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Migration Checklist

When refactoring API usage:

- [ ] Remove all `import { API_URL } from '@env'` from screens
- [ ] Replace direct `api.get()/api.post()` calls with service functions
- [ ] Add missing service methods for posts and challenges
- [ ] Create `getProfilePictureUrl()` helper in api.ts
- [ ] Update all screens to use `getProfilePictureUrl()`
- [ ] Add automatic token refresh interceptor
- [ ] Standardize error response handling
- [ ] Update tests to mock service layer
- [ ] Document any new service methods
- [ ] Clear Metro cache and test all screens

---

## Support

For API documentation, visit: https://zerowaste.ink/api/docs

For mobile app issues, check:
1. `.env` file is configured correctly
2. Metro bundler is running (`npx expo start`)
3. Backend server is accessible
4. Authentication tokens are valid
5. Console logs for detailed error messages
