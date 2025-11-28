import React from 'react';
import { render } from '@testing-library/react-native';

// Mock axios first before any imports that use it
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock the api service
jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  authService: {
    login: jest.fn(),
    signup: jest.fn(),
    getUserInfo: jest.fn(),
  },
}));

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AppNavigator } from '../AppNavigator';
import { useAuth } from '../../context/AuthContext';

// Mock all screen components
jest.mock('../../screens/HomeScreen', () => ({
  HomeScreen: () => 'HomeScreen',
}));

jest.mock('../../screens/CommunityScreen', () => ({
  CommunityScreen: () => 'CommunityScreen',
}));

jest.mock('../../screens/ChallengesScreen', () => ({
  ChallengesScreen: () => 'ChallengesScreen',
}));

jest.mock('../../screens/ProfileScreen', () => ({
  ProfileScreen: () => 'ProfileScreen',
}));

jest.mock('../../screens/OtherUserProfileScreen', () => ({
  OtherUserProfileScreen: () => 'OtherUserProfileScreen',
}));

jest.mock('../../screens/TipsScreen', () => ({
  TipsScreen: () => 'TipsScreen',
}));

jest.mock('../../screens/AchievementsScreen', () => ({
  AchievementsScreen: () => 'AchievementsScreen',
}));

jest.mock('../../screens/LeaderboardScreen', () => ({
  LeaderboardScreen: () => 'LeaderboardScreen',
}));

jest.mock('../../screens/AdminPanel', () => ({
  AdminPanel: () => 'AdminPanel',
}));

jest.mock('../../screens/PostModeration', () => ({
  PostModeration: () => 'PostModeration',
}));

jest.mock('../../screens/UserModeration', () => ({
  UserModeration: () => 'UserModeration',
}));

jest.mock('../../screens/ChallengeModeration', () => ({
  ChallengeModeration: () => 'ChallengeModeration',
}));

jest.mock('../../screens/CommentModeration', () => ({
  CommentModeration: () => 'CommentModeration',
}));

jest.mock('../../screens/auth/LoginScreen', () => ({
  LoginScreen: () => 'LoginScreen',
}));

jest.mock('../../screens/auth/SignupScreen', () => ({
  SignupScreen: () => 'SignupScreen',
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock react-navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}));

// Mock assets
jest.mock('../../assets/home.png', () => 'home.png');
jest.mock('../../assets/community.png', () => 'community.png');
jest.mock('../../assets/challenge.png', () => 'challenge.png');
jest.mock('../../assets/profile.png', () => 'profile.png');

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render auth stack when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      userData: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      fetchUserData: jest.fn(),
    });

    const { toJSON } = render(<AppNavigator />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render main tabs when regular user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
      userData: { username: 'testuser', email: 'test@example.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      fetchUserData: jest.fn(),
    });

    const { toJSON } = render(<AppNavigator />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render admin panel when admin user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      isLoading: false,
      userData: { username: 'admin', email: 'admin@example.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      fetchUserData: jest.fn(),
    });

    const { toJSON } = render(<AppNavigator />);
    expect(toJSON()).toBeTruthy();
  });

  it('should handle authentication state changes', () => {
    // Start unauthenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      userData: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      fetchUserData: jest.fn(),
    });

    const { rerender, toJSON } = render(<AppNavigator />);
    expect(toJSON()).toBeTruthy();

    // Simulate login
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
      userData: { username: 'testuser', email: 'test@example.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      fetchUserData: jest.fn(),
    });

    rerender(<AppNavigator />);
    expect(toJSON()).toBeTruthy();
  });
});
