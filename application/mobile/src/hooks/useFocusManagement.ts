import { useRef, useEffect } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

export const useFocusManagement = () => {
  const firstFocusableRef = useRef<any>(null);
  const lastFocusableRef = useRef<any>(null);

  // Set focus to first focusable element
  const focusFirst = () => {
    if (firstFocusableRef.current) {
      const reactTag = findNodeHandle(firstFocusableRef.current);
      if (reactTag) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }
  };

  // Set focus to last focusable element
  const focusLast = () => {
    if (lastFocusableRef.current) {
      const reactTag = findNodeHandle(lastFocusableRef.current);
      if (reactTag) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }
  };

  // Announce screen change to screen readers
  const announceScreenChange = (screenName: string) => {
    AccessibilityInfo.announceForAccessibility(`Navigated to ${screenName} screen`);
  };

  // Announce important actions
  const announceAction = (action: string) => {
    AccessibilityInfo.announceForAccessibility(action);
  };

  return {
    firstFocusableRef,
    lastFocusableRef,
    focusFirst,
    focusLast,
    announceScreenChange,
    announceAction,
  };
};
