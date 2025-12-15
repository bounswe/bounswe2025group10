import { useNavigation as useRNNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

export const useAppNavigation = () => {
  const navigation = useRNNavigation();

  // Standardized navigation methods with consistent behavior
  const navigateToScreen = useCallback((screenName: string, params?: any) => {
    navigation.navigate(screenName as never, params as never);
  }, [navigation]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const resetToScreen = useCallback((screenName: string, params?: any) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName, params }],
    });
  }, [navigation]);

  const canGoBack = useCallback(() => {
    return navigation.canGoBack();
  }, [navigation]);

  return {
    navigateToScreen,
    goBack,
    resetToScreen,
    canGoBack,
    navigation,
  };
};

// Screen names constants for consistency
export const SCREEN_NAMES = {
  // Auth screens
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  
  // Main app screens
  MAIN_TABS: 'MainTabs',
  HOME: 'Home',
  COMMUNITY: 'Community',
  CHALLENGES: 'Challenges',
  PROFILE: 'Profile',
  
  // Additional screens (to be created)
  TIPS: 'Tips',
  ACHIEVEMENTS: 'Achievements',
  LEADERBOARD: 'Leaderboard',
  
  // Modal/Detail screens
  OTHER_PROFILE: 'OtherProfile',
} as const;

// Navigation types for type safety
export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];

