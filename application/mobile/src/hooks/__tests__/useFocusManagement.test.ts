import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { useFocusManagement } from '../useFocusManagement';

// Mock React Native modules
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    setAccessibilityFocus: jest.fn(),
    announceForAccessibility: jest.fn(),
  },
  findNodeHandle: jest.fn(),
}));

describe('useFocusManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all expected functions and refs', () => {
    const { result } = renderHook(() => useFocusManagement());

    expect(result.current.firstFocusableRef).toBeDefined();
    expect(result.current.lastFocusableRef).toBeDefined();
    expect(result.current.focusFirst).toBeInstanceOf(Function);
    expect(result.current.focusLast).toBeInstanceOf(Function);
    expect(result.current.announceScreenChange).toBeInstanceOf(Function);
    expect(result.current.announceAction).toBeInstanceOf(Function);
  });

  describe('focusFirst', () => {
    it('should set accessibility focus on first focusable element', () => {
      const mockReactTag = 123;
      (findNodeHandle as jest.Mock).mockReturnValue(mockReactTag);

      const { result } = renderHook(() => useFocusManagement());

      // Simulate a ref being set
      result.current.firstFocusableRef.current = { _nativeTag: 123 };

      act(() => {
        result.current.focusFirst();
      });

      expect(findNodeHandle).toHaveBeenCalledWith(result.current.firstFocusableRef.current);
      expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(mockReactTag);
    });

    it('should not set focus if ref is null', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.focusFirst();
      });

      expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('should not set focus if findNodeHandle returns null', () => {
      (findNodeHandle as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useFocusManagement());
      result.current.firstFocusableRef.current = { _nativeTag: 123 };

      act(() => {
        result.current.focusFirst();
      });

      expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });
  });

  describe('focusLast', () => {
    it('should set accessibility focus on last focusable element', () => {
      const mockReactTag = 456;
      (findNodeHandle as jest.Mock).mockReturnValue(mockReactTag);

      const { result } = renderHook(() => useFocusManagement());

      // Simulate a ref being set
      result.current.lastFocusableRef.current = { _nativeTag: 456 };

      act(() => {
        result.current.focusLast();
      });

      expect(findNodeHandle).toHaveBeenCalledWith(result.current.lastFocusableRef.current);
      expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(mockReactTag);
    });

    it('should not set focus if ref is null', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.focusLast();
      });

      expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('should not set focus if findNodeHandle returns null', () => {
      (findNodeHandle as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useFocusManagement());
      result.current.lastFocusableRef.current = { _nativeTag: 456 };

      act(() => {
        result.current.focusLast();
      });

      expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });
  });

  describe('announceScreenChange', () => {
    it('should announce screen change to screen readers', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.announceScreenChange('Home');
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Navigated to Home screen'
      );
    });

    it('should handle different screen names', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.announceScreenChange('Profile');
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Navigated to Profile screen'
      );
    });
  });

  describe('announceAction', () => {
    it('should announce action to screen readers', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.announceAction('Item deleted successfully');
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Item deleted successfully'
      );
    });

    it('should handle different action messages', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.announceAction('Profile updated');
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Profile updated'
      );
    });
  });
});
