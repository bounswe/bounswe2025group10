# Mobile App Testing Documentation

This document provides comprehensive information about testing in the Zero Waste Challenge mobile application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The mobile app uses the following testing stack:

- **Jest**: Testing framework
- **React Native Testing Library**: Component testing utilities
- **React Test Renderer**: Rendering React components in tests
- **TypeScript**: Type-safe test code

### Test Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Structure

```
src/
├── components/
│   ├── __tests__/
│   │   ├── AppHeader.test.tsx
│   │   ├── MoreDropdown.test.tsx
│   │   └── ScreenWrapper.test.tsx
├── context/
│   └── __tests__/
│       └── AuthContext.test.tsx
├── hooks/
│   └── __tests__/
│       └── useNavigation.test.ts
├── screens/
│   ├── __tests__/
│   │   └── HomeScreen.test.tsx
│   └── auth/
│       └── __tests__/
│           ├── LoginScreen.test.tsx
│           └── SignupScreen.test.tsx
├── services/
│   └── __tests__/
│       └── api.test.ts
└── utils/
    └── __tests__/
        ├── storage.test.ts
        └── theme.test.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run tests in debug mode
npm run test:debug
```

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- storage.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="AuthContext"

# Run tests in a specific directory
npm test -- src/components/__tests__
```

### Watch Mode Options

When running in watch mode, you can:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename pattern
- Press `t` to filter by test name pattern
- Press `q` to quit watch mode

## Test Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`, you'll find:

1. **Terminal Output**: Summary in the console
2. **HTML Report**: Open `coverage/lcov-report/index.html` in a browser
3. **Detailed Files**: Individual file coverage in `coverage/` directory

### Coverage Metrics

The coverage report shows:
- **Lines**: Percentage of code lines executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of conditional branches tested
- **Statements**: Percentage of statements executed

### Excluded from Coverage

The following are automatically excluded:
- `src/**/*.d.ts` (TypeScript declarations)
- `src/**/index.{ts,tsx}` (Index files)
- `**/__tests__/**` (Test files themselves)
- `**/__mocks__/**` (Mock files)

## Writing Tests

### Test File Naming

- Place test files in `__tests__` directory
- Name test files with `.test.ts` or `.test.tsx` extension
- Match source file name: `MyComponent.tsx` → `MyComponent.test.tsx`

### Basic Test Structure

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup code runs before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup code runs after each test
  });

  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);
    
    fireEvent.press(getByText('Click me'));
    
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should handle async operations', async () => {
    const { getByText } = render(<MyComponent />);
    
    await waitFor(() => {
      expect(getByText('Loaded')).toBeTruthy();
    });
  });
});
```

### Testing Components

```typescript
import { render, fireEvent } from '@testing-library/react-native';

// Test rendering
const { getByText, getByTestId, queryByText } = render(<Component />);

// Query elements
expect(getByText('Hello')).toBeTruthy();
expect(getByTestId('my-button')).toBeTruthy();
expect(queryByText('Not found')).toBeNull(); // Won't throw

// Simulate events
fireEvent.press(getByText('Button'));
fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react-native';

const { result } = renderHook(() => useMyHook());

// Access hook return value
expect(result.current.value).toBe('initial');

// Update hook
act(() => {
  result.current.setValue('new');
});

expect(result.current.value).toBe('new');
```

### Mocking

#### Mock API Calls

```typescript
jest.mock('../../services/api');

const mockAuthService = authService as jest.Mocked<typeof authService>;

mockAuthService.login.mockResolvedValueOnce({
  token: { access: 'token', refresh: 'refresh' },
});
```

#### Mock Navigation

```typescript
jest.mock('@react-navigation/native');

const mockNavigate = jest.fn();
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

mockUseNavigation.mockReturnValue({
  navigate: mockNavigate,
  goBack: jest.fn(),
} as any);
```

#### Mock AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Already mocked globally in jest.setup.js
(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-value');
```

#### Mock Alerts

```typescript
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Test code...

expect(Alert.alert).toHaveBeenCalledWith('Error', 'Message');
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ Bad:
```typescript
expect(component.state.isLoading).toBe(true);
```

✅ Good:
```typescript
expect(getByText('Loading...')).toBeTruthy();
```

### 2. Use Meaningful Test Descriptions

❌ Bad:
```typescript
it('test 1', () => { ... });
```

✅ Good:
```typescript
it('should display error message when login fails', () => { ... });
```

### 3. Keep Tests Independent

Each test should be able to run independently without relying on other tests.

```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
});
```

### 4. Test Edge Cases

Don't just test the happy path:
- Empty states
- Error conditions
- Loading states
- Invalid inputs
- Boundary conditions

### 5. Use waitFor for Async Operations

```typescript
await waitFor(() => {
  expect(getByText('Success')).toBeTruthy();
});
```

### 6. Avoid Implementation Details

Don't test internal state or private methods. Focus on user-facing behavior.

### 7. Mock External Dependencies

Always mock:
- API calls
- Navigation
- Storage operations
- Third-party libraries

### 8. Use testID for Complex Queries

```tsx
<TouchableOpacity testID="submit-button">
  <Text>Submit</Text>
</TouchableOpacity>

// In tests
const button = getByTestId('submit-button');
```

### 9. Test Accessibility

```typescript
const button = getByTestId('my-button');
expect(button.props.accessibilityLabel).toBe('Submit form');
expect(button.props.accessibilityRole).toBe('button');
```

### 10. Group Related Tests

```typescript
describe('LoginScreen', () => {
  describe('validation', () => {
    it('should show error for empty email', () => { ... });
    it('should show error for invalid email', () => { ... });
  });

  describe('submission', () => {
    it('should call login API on submit', () => { ... });
    it('should navigate on success', () => { ... });
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Problem**: Import paths in tests don't resolve correctly.

**Solution**: Check `moduleNameMapper` in `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@env$': '<rootDir>/__mocks__/env.js',
}
```

#### 2. "Invariant Violation" or component errors

**Problem**: React Native components not properly mocked.

**Solution**: Ensure `jest.setup.js` has all necessary mocks. Add missing ones:
```javascript
jest.mock('react-native-component', () => 'MockedComponent');
```

#### 3. Async tests timing out

**Problem**: `waitFor` times out waiting for condition.

**Solution**: 
- Increase timeout: `waitFor(() => { ... }, { timeout: 5000 })`
- Check if async operations are properly mocked
- Verify the condition will eventually be true

#### 4. Tests pass locally but fail in CI

**Problem**: Timing or environment differences.

**Solution**:
- Use `waitFor` for all async operations
- Don't rely on specific timings
- Mock all external dependencies

#### 5. Memory leaks in tests

**Problem**: Tests slow down or crash.

**Solution**:
```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  cleanup(); // From testing library
});
```

#### 6. Snapshot tests failing

**Problem**: Component output changed.

**Solution**:
```bash
# Update snapshots if changes are intentional
npm test -- -u

# Or update specific snapshot
npm test -- MyComponent.test.tsx -u
```

### Debugging Tests

#### Enable Verbose Logging

```bash
npm run test:verbose
```

#### Debug in VS Code

1. Add breakpoint in test file
2. Run: `npm run test:debug`
3. Open `chrome://inspect` in Chrome
4. Click "inspect" under the Node process

#### See Test Output

```typescript
const { debug } = render(<Component />);
debug(); // Prints component tree
```

## Testing Utilities Reference

### Query Methods

- `getByText(text)` - Find by text content (throws if not found)
- `queryByText(text)` - Find by text content (returns null if not found)
- `findByText(text)` - Async find by text content
- `getByTestId(id)` - Find by testID prop
- `getByPlaceholderText(text)` - Find by placeholder
- `getAllByText(text)` - Find all matching elements

### Fire Events

```typescript
fireEvent.press(element);
fireEvent.changeText(input, 'new text');
fireEvent(element, 'customEvent', eventData);
```

### Async Utilities

```typescript
await waitFor(() => { ... }, { timeout: 3000 });
await waitForElementToBeRemoved(() => getByText('Loading'));
```

### Matchers

```typescript
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();
expect(array).toContain(item);
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)

## Contributing

When adding new features:
1. Write tests before or alongside the feature
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Aim for >70% coverage on new code
5. Add complex test scenarios to this documentation

---

**Last Updated**: November 2025
**Maintainer**: Development Team

