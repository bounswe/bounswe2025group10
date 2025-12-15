# Test Suite Overview

This directory contains comprehensive unit tests for the Zero Waste Challenge mobile application.

## 📊 Test Coverage

### Current Test Files

#### Utils (`src/utils/__tests__/`)
- ✅ `storage.test.ts` - AsyncStorage operations
- ✅ `theme.test.ts` - Theme constants and styles

#### Services (`src/services/__tests__/`)
- ✅ `api.test.ts` - All API service methods

#### Context (`src/context/__tests__/`)
- ✅ `AuthContext.test.tsx` - Authentication state management

#### Hooks (`src/hooks/__tests__/`)
- ✅ `useNavigation.test.ts` - Navigation hooks

#### Components (`src/components/__tests__/`)
- ✅ `AppHeader.test.tsx` - App header component
- ✅ `MoreDropdown.test.tsx` - Dropdown menu component
- ✅ `ScreenWrapper.test.tsx` - Screen wrapper component

#### Screens (`src/screens/__tests__/` and `src/screens/auth/__tests__/`)
- ✅ `LoginScreen.test.tsx` - Login screen with validation
- ✅ `SignupScreen.test.tsx` - Signup screen with validation
- ✅ `HomeScreen.test.tsx` - Home screen with waste tracking

## 🚀 Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📈 Coverage Goals

We aim for at least 70% coverage across:
- **Branches**: Conditional logic paths
- **Functions**: Function execution
- **Lines**: Code lines executed
- **Statements**: Individual statements

## 🧪 Test Categories

### 1. Unit Tests
Test individual functions and components in isolation.

**Example**: Testing the `storage.setToken()` function

### 2. Integration Tests
Test how multiple components work together.

**Example**: Testing AuthContext with storage and API calls

### 3. Component Tests
Test React components with user interactions.

**Example**: Testing LoginScreen form submission

## 📝 Writing New Tests

### 1. Create Test File
Place in `__tests__` directory next to the source file:
```
src/
  components/
    __tests__/
      MyComponent.test.tsx
    MyComponent.tsx
```

### 2. Import Testing Utilities
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
```

### 3. Write Tests
```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

### 4. Run Tests
```bash
npm test -- MyComponent.test.tsx
```

## 🔧 Common Test Patterns

### Testing Async Operations
```typescript
await waitFor(() => {
  expect(getByText('Loaded')).toBeTruthy();
});
```

### Mocking API Calls
```typescript
jest.mock('../../services/api');
mockService.method.mockResolvedValueOnce(data);
```

### Testing User Input
```typescript
const input = getByPlaceholderText('Email');
fireEvent.changeText(input, 'test@example.com');
```

### Testing Navigation
```typescript
const mockNavigate = jest.fn();
// ... render component ...
expect(mockNavigate).toHaveBeenCalledWith('ScreenName');
```

## 📚 Test Files by Feature

### Authentication
- `AuthContext.test.tsx` - Auth state management
- `LoginScreen.test.tsx` - Login UI and validation
- `SignupScreen.test.tsx` - Signup UI and validation
- `storage.test.ts` - Token storage

### Waste Tracking
- `HomeScreen.test.tsx` - Waste entry and display
- `api.test.ts` - Waste service API calls

### Navigation
- `useNavigation.test.ts` - Navigation helpers
- `AppHeader.test.tsx` - Back button functionality

### UI Components
- `ScreenWrapper.test.tsx` - Screen layout
- `MoreDropdown.test.tsx` - Dropdown interactions

## 🐛 Debugging Tests

### View Test Output
```bash
npm run test:verbose
```

### Debug Single Test
```bash
npm test -- --testNamePattern="should login successfully"
```

### Run Tests for One File
```bash
npm test -- LoginScreen.test.tsx
```

### Update Snapshots
```bash
npm test -- -u
```

## 📖 Additional Documentation

For comprehensive testing documentation, see:
- `TEST_DOCUMENTATION.md` in the mobile root directory
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## ✅ Pre-commit Checklist

Before committing:
1. ✅ Run all tests: `npm test`
2. ✅ Check coverage: `npm run test:coverage`
3. ✅ Fix any failing tests
4. ✅ Aim for >70% coverage on new code
5. ✅ Update test documentation if needed

## 🤝 Contributing

When adding new features:
1. Write tests for new components/functions
2. Update existing tests if behavior changes
3. Maintain or improve coverage percentage
4. Document complex test scenarios

---

**Need help?** Check the main `TEST_DOCUMENTATION.md` or ask the team!

