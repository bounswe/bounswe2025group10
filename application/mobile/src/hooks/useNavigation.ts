import { useNavigation as useRNNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useCallback } from 'react';

// Define the app's navigation param list
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Home: undefined;
  Community: undefined;
  Challenges: undefined;
  Profile: undefined;
  Tips: undefined;
  Achievements: undefined;
  Leaderboard: undefined;
  OtherProfile: { username: string };
  AdminPanel: undefined;
  PostModeration: undefined;
  CommentModeration: undefined;
  ChallengeModeration: undefined;
  UserModeration: undefined;
};

export const useAppNavigation = () => {
  const navigation = useRNNavigation<NavigationProp<RootStackParamList>>();

  // Standardized navigation methods with consistent behavior
  const navigateToScreen = useCallback(<T extends keyof RootStackParamList>(
    screenName: T,
    params?: RootStackParamList[T]
  ) => {
    // Use type assertion for navigation compatibility
    (navigation as NavigationProp<ParamListBase>).navigate(screenName as string, params);
  }, [navigation]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const resetToScreen = useCallback(<T extends keyof RootStackParamList>(
    screenName: T,
    params?: RootStackParamList[T]
  ) => {
    (navigation as NavigationProp<ParamListBase>).reset({
      index: 0,
      routes: [{ name: screenName as string, params }],
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

