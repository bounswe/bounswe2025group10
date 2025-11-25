import { renderHook } from '@testing-library/react-native';
import { useAppNavigation, SCREEN_NAMES } from '../useNavigation';

// Mock react-navigation before importing
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    reset: mockReset,
    canGoBack: mockCanGoBack,
  }),
}));

describe('useAppNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigateToScreen', () => {
    it('should navigate to a screen without params', () => {
      const { result } = renderHook(() => useAppNavigation());

      result.current.navigateToScreen(SCREEN_NAMES.HOME);

      expect(mockNavigate).toHaveBeenCalledWith(SCREEN_NAMES.HOME, undefined);
    });

    it('should navigate to a screen with params', () => {
      const { result } = renderHook(() => useAppNavigation());
      const params = { userId: 123 };

      result.current.navigateToScreen(SCREEN_NAMES.OTHER_PROFILE, params);

      expect(mockNavigate).toHaveBeenCalledWith(SCREEN_NAMES.OTHER_PROFILE, params);
    });

    it('should navigate to multiple screens sequentially', () => {
      const { result } = renderHook(() => useAppNavigation());

      result.current.navigateToScreen(SCREEN_NAMES.COMMUNITY);
      result.current.navigateToScreen(SCREEN_NAMES.PROFILE);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, SCREEN_NAMES.COMMUNITY, undefined);
      expect(mockNavigate).toHaveBeenNthCalledWith(2, SCREEN_NAMES.PROFILE, undefined);
    });
  });

  describe('goBack', () => {
    it('should go back when navigation can go back', () => {
      mockCanGoBack.mockReturnValue(true);
      const { result } = renderHook(() => useAppNavigation());

      result.current.goBack();

      expect(mockCanGoBack).toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should not go back when navigation cannot go back', () => {
      mockCanGoBack.mockReturnValue(false);
      const { result } = renderHook(() => useAppNavigation());

      result.current.goBack();

      expect(mockCanGoBack).toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('resetToScreen', () => {
    it('should reset navigation to a screen without params', () => {
      const { result } = renderHook(() => useAppNavigation());

      result.current.resetToScreen(SCREEN_NAMES.LOGIN);

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREEN_NAMES.LOGIN, params: undefined }],
      });
    });

    it('should reset navigation to a screen with params', () => {
      const { result } = renderHook(() => useAppNavigation());
      const params = { resetToken: 'abc123' };

      result.current.resetToScreen(SCREEN_NAMES.LOGIN, params);

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: SCREEN_NAMES.LOGIN, params }],
      });
    });
  });

  describe('canGoBack', () => {
    it('should return true when navigation can go back', () => {
      mockCanGoBack.mockReturnValue(true);
      const { result } = renderHook(() => useAppNavigation());

      const canGoBack = result.current.canGoBack();

      expect(canGoBack).toBe(true);
      expect(mockCanGoBack).toHaveBeenCalled();
    });

    it('should return false when navigation cannot go back', () => {
      mockCanGoBack.mockReturnValue(false);
      const { result } = renderHook(() => useAppNavigation());

      const canGoBack = result.current.canGoBack();

      expect(canGoBack).toBe(false);
      expect(mockCanGoBack).toHaveBeenCalled();
    });
  });

  describe('navigation object', () => {
    it('should expose the underlying navigation object', () => {
      const { result } = renderHook(() => useAppNavigation());

      expect(result.current.navigation).toBeDefined();
      expect(result.current.navigation.navigate).toBe(mockNavigate);
      expect(result.current.navigation.goBack).toBe(mockGoBack);
      expect(result.current.navigation.reset).toBe(mockReset);
    });
  });
});

describe('SCREEN_NAMES', () => {
  it('should have all required screen name constants', () => {
    expect(SCREEN_NAMES).toHaveProperty('LOGIN');
    expect(SCREEN_NAMES).toHaveProperty('SIGNUP');
    expect(SCREEN_NAMES).toHaveProperty('MAIN_TABS');
    expect(SCREEN_NAMES).toHaveProperty('HOME');
    expect(SCREEN_NAMES).toHaveProperty('COMMUNITY');
    expect(SCREEN_NAMES).toHaveProperty('CHALLENGES');
    expect(SCREEN_NAMES).toHaveProperty('PROFILE');
    expect(SCREEN_NAMES).toHaveProperty('TIPS');
    expect(SCREEN_NAMES).toHaveProperty('ACHIEVEMENTS');
    expect(SCREEN_NAMES).toHaveProperty('LEADERBOARD');
    expect(SCREEN_NAMES).toHaveProperty('OTHER_PROFILE');
  });

  it('should have correct screen name values', () => {
    expect(SCREEN_NAMES.LOGIN).toBe('Login');
    expect(SCREEN_NAMES.SIGNUP).toBe('Signup');
    expect(SCREEN_NAMES.HOME).toBe('Home');
    expect(SCREEN_NAMES.COMMUNITY).toBe('Community');
    expect(SCREEN_NAMES.PROFILE).toBe('Profile');
  });

  it('should have unique screen names', () => {
    const values = Object.values(SCREEN_NAMES);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

