# Mobile App Shortcomings Analysis

This document identifies potential issues and areas for improvement in the Zero Waste mobile application.

**Last Updated**: December 2024

---

## Fixed Issues (Completed)

| Issue | Status | Commit |
|-------|--------|--------|
| Console logging in production (88 statements) | FIXED | Added logger utility |
| Type safety - `any` types in screens | FIXED | Replaced with proper types |
| Weak error handling | FIXED | Added structured error utility |
| Profile pictures disabled | FIXED | Enabled API loading with fallback |
| Missing ChallengeModeration tests | FIXED | Added 13 test cases |
| ThemeContext mock for tests | FIXED | Added to jest.setup.js |

---

## Current Issues Summary

| Category | Severity | Count | Impact |
|----------|----------|-------|--------|
| Console statements (missed) | MEDIUM | 4 | Data exposure |
| Type Safety in api.ts | HIGH | 25+ | Maintainability |
| Hardcoded Values | MEDIUM | 8 | Flexibility |
| Security Concerns | MEDIUM | 3 | Security |
| useEffect Dependencies | MEDIUM | 2 | Performance bugs |
| Undocumented API Endpoints | LOW | 3 | Documentation |
| Error Handling Gaps | MEDIUM | 6 | UX |
| Code Duplication | MEDIUM | 3+ patterns | Maintainability |

---

## 1. Console Statements (Should Use Logger)

### Files Affected

**src/screens/OtherUserProfileScreen.tsx**
- **Line 69**: `console.warn('Error fetching follow status:', error);`

**src/screens/ProfileScreen.tsx**
- **Line 103**: `console.warn('Error fetching follow stats');`
- **Line 118**: `console.warn('Error fetching followers:', err);`
- **Line 136**: `console.warn('Error fetching following:', err);`

### Recommended Fix
Replace all `console.warn` with `logger.warn` from `../utils/logger`.

---

## 2. Type Safety Issues in api.ts

### Functions Returning `Promise<any>`

| Line | Function | Should Return |
|------|----------|---------------|
| 181 | getUserInfo | `Promise<UserInfo>` |
| 199 | getUserWastes | `Promise<WasteResponse>` |
| 217 | addUserWaste | `Promise<WasteEntry>` |
| 225 | getAllTips | `Promise<TipsResponse>` |
| 248 | createTip | `Promise<Tip>` |
| 256 | likeTip | `Promise<void>` |
| 264 | dislikeTip | `Promise<void>` |
| 272 | reportTip | `Promise<void>` |
| 354 | getChallenges | `Promise<Challenge[]>` |
| 362 | createChallenge | `Promise<Challenge>` |
| 399 | uploadProfilePicture | `Promise<ProfilePictureResponse>` |
| 431+ | follow/unfollow functions | `Promise<FollowResponse>` |

### Recommended Fix
Create TypeScript interfaces for all API responses in a separate `types/api.ts` file.

---

## 3. Hardcoded Values & Magic Numbers

### src/screens/HomeScreen.tsx
- **Lines 234-235**: Istanbul coordinates hardcoded
  ```typescript
  const lat = 41.0082;
  const lon = 28.9784;
  ```
- **Line 155**: Warning threshold `totalGrams > 500`
- **Line 156**: Max limit `totalGrams > 5000`
- **Line 548**: Hardcoded colors `'#dc2626'`, `'#059669'`

### src/screens/LeaderboardScreen.tsx
- **Lines 147-151**: Medal colors hardcoded
  - Gold: `'#FFD700'`
  - Silver: `'#C0C0C0'`
  - Bronze: `'#CD7F32'`

### Recommended Fix
Extract to `src/utils/constants.ts`:
```typescript
export const WASTE_THRESHOLDS = {
  WARNING: 500,
  MAX: 5000,
};

export const MEDAL_COLORS = {
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
  BRONZE: '#CD7F32',
};

export const DEFAULT_LOCATION = {
  LAT: 41.0082,
  LON: 28.9784,
  NAME: 'Istanbul',
};
```

---

## 4. Security Concerns

### 4.1 Fake Login Endpoint (api.ts:193)
```typescript
fakeLogin: async (): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/fake-login/`);
```
**Risk**: Development endpoint exposed in production code.
**Fix**: Guard with `__DEV__` or remove entirely.

### 4.2 Manual Token Handling in Multipart Uploads (api.ts:306-316, 400-412)
```typescript
const token = cachedToken || await storage.getToken();
```
**Risk**: Bypasses axios interceptors, token refresh may not work.
**Fix**: Use the `axiosInstance` for all requests.

### 4.3 Unauthenticated Request Possible (api.ts:400-412)
```typescript
const response = await axios.post(`${API_URL}/api/profile/profile-picture/`, formData, {
```
**Risk**: If token is null, request goes unauthenticated.
**Fix**: Add token validation before request.

---

## 5. useEffect Dependency Issues

### src/screens/ChallengesScreen.tsx (Line 122)
```typescript
const fetchChallenges = useCallback(async () => {
  // ...
}, [refreshing]);  // Bug: refreshing causes unnecessary recreations
```

### src/screens/LeaderboardScreen.tsx (Line 104)
```typescript
}, [refreshing]);  // Same issue
```

**Fix**: Remove `refreshing` from dependency arrays. Use a ref or move the condition inside the function.

---

## 6. Undocumented API Endpoints

The following endpoints are used in code but not documented in CLAUDE.md:

| Endpoint | Location | Purpose |
|----------|----------|---------|
| `/api/profile/{username}/follow-status/` | api.ts:432 | Get follow status |
| `/api/profile/{username}/followers/` | api.ts:438 | Get followers list |
| `/api/profile/{username}/following/` | api.ts:444 | Get following list |
| `/api/profile/{username}/follow/` | api.ts:420 | Follow user |
| `/api/profile/{username}/unfollow/` | api.ts:426 | Unfollow user |

**Fix**: Add these endpoints to CLAUDE.md API documentation.

---

## 7. Error Handling Gaps

### 7.1 Silent Weather Failure (HomeScreen.tsx:237-241)
```typescript
} catch (err) {
  logger.warn('Weather fetch error:', err);  // Silent fail, no user feedback
}
```

### 7.2 Generic Login Error (AuthContext.tsx:75-76)
```typescript
} catch (error) {
  logger.error('Login error:', error);
  return null;  // Doesn't differentiate auth failure vs network error
}
```

### 7.3 No Deadline Validation (ChallengesScreen.tsx:129-133)
```typescript
if (!title || !description || !targetAmount || !deadline) {
  // Only checks if filled, not if valid date format
```

### Recommended Fix
Use the `getErrorMessage()` utility consistently and add specific validation.

---

## 8. Code Duplication Patterns

### 8.1 Fetch + Loading + Error Pattern
Repeated in: HomeScreen, ProfileScreen, ChallengesScreen, TipsScreen, CommunityScreen

**Example**:
```typescript
const [loading, setLoading] = useState(false);
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await service.getData();
    setData(response.data);
  } catch (err) {
    Alert.alert('Error', getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
```

**Fix**: Create custom hooks like `useFetch()` or use React Query.

### 8.2 Profile Picture Source Logic
Repeated in: ProfileScreen, LeaderboardScreen, CommunityScreen, OtherUserProfileScreen

**Fix**: Extract to utility function:
```typescript
export const getProfileImageSource = (username?: string) =>
  username
    ? { uri: getProfilePictureUrl(username) }
    : PROFILE_PLACEHOLDER;
```

---

## 9. Type Coercion Issues

### ChallengesScreen.tsx (Line 204)
```typescript
const challengeId = uc.challenge as unknown as number;
```
**Issue**: Double cast suggests underlying type mismatch.
**Fix**: Fix the `UserChallenge` interface to have correct type.

### ProfileScreen.tsx (Line 265)
```typescript
const uploadError = error as { message?: string; response?: { data?: unknown; status?: number } };
```
**Issue**: Over-specific type assertion.
**Fix**: Create a proper `ApiError` interface.

---

## 10. Accessibility Gaps

### Missing accessibilityLabel
Many `TouchableOpacity` components lack accessibility labels:
- Profile pictures (tap to view profile)
- Like/dislike buttons
- Modal close buttons
- Dropdown triggers

### Missing accessibilityRole
Components should declare their roles:
- `button` for TouchableOpacity
- `header` for section titles
- `list` for FlatList

---

## Priority Recommendations

### Phase 1 (Immediate)
1. Fix 4 remaining console.warn statements
2. Add proper TypeScript interfaces for api.ts functions
3. Remove or guard `fakeLogin` endpoint
4. Fix useEffect dependency arrays

### Phase 2 (Short-term)
1. Extract hardcoded values to constants
2. Document new follow-related API endpoints
3. Add input validation for date fields
4. Fix multipart upload token handling

### Phase 3 (Medium-term)
1. Create custom hooks to reduce code duplication
2. Add proper accessibility labels
3. Implement better error differentiation in login
4. Add weather failure UI feedback

---

## Metrics

- **Issues Fixed This Session**: 6
- **New Issues Found**: 12
- **Total Current Issues**: ~35
- **Critical Issues**: 4
- **Medium Issues**: 20
- **Low Issues**: 11

---

*Document maintained as part of code quality improvement initiative.*
