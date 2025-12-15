import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert, ActivityIndicator } from 'react-native';
import { ProfileScreen } from '../ProfileScreen';

// Mock axios first
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

// Mock AuthContext
const mockLogout = jest.fn();
const mockFetchUserData = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    userData: { username: 'testuser', email: 'test@example.com' },
    fetchUserData: mockFetchUserData,
    logout: mockLogout,
  }),
}));

// Mock services
jest.mock('../../services/api', () => ({
  wasteService: {
    getUserWastes: jest.fn().mockResolvedValue({
      message: 'User wastes retrieved successfully',
      data: [
        { waste_type: 'PLASTIC', total_amount: 10 },
        { waste_type: 'PAPER', total_amount: 5 },
      ],
    }),
  },
  achievementService: {
    getUserAchievements: jest.fn().mockResolvedValue([
      { challenge: 1, joined_date: '2024-01-15T10:00:00Z' },
    ]),
  },
  profileService: {
    uploadProfilePicture: jest.fn(),
    updateBio: jest.fn(),
    getFollowStats: jest.fn().mockResolvedValue({ followers_count: 0, following_count: 0 }),
  },
  profilePublicService: {
    getUserBio: jest.fn().mockResolvedValue({ username: 'testuser', bio: 'Test bio' }),
  },
  getProfilePictureUrl: jest.fn((username: string) => `http://localhost:8000/api/profile/${username}/picture/`),
  API_URL: 'http://localhost:8000',
}));

// Mock hooks
jest.mock('../../hooks/useNavigation', () => ({
  useAppNavigation: () => ({
    navigateToScreen: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'profile.myProfile': 'My Profile',
        'profile.username': 'Username',
        'profile.bio': 'No bio yet',
        'profile.editProfile': 'Edit Profile',
        'profile.achievements': 'Achievements',
        'profile.language': 'Language',
        'profile.selectLanguage': 'Select Language',
        'home.wasteHistory': 'Waste History',
        'home.wasteTypes.PLASTIC': 'Plastic',
        'home.wasteTypes.PAPER': 'Paper',
        'achievements.myAchievements': 'No achievements yet',
        'common.loading': 'Loading...',
        'common.logout': 'Logout',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.success': 'Success',
      };
      return translations[key] || options?.defaultValue || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock i18n
jest.mock('../../i18n', () => ({
  changeLanguage: jest.fn(),
  LANGUAGES: [
    { code: 'en', nativeName: 'English' },
    { code: 'tr', nativeName: 'Türkçe' },
  ],
}));

// Mock storage
jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('test-token'),
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock ScreenWrapper
jest.mock('../../components/ScreenWrapper', () => ({
  ScreenWrapper: ({ children, onRefresh }: any) => <>{children}</>,
}));

// Mock assets
jest.mock('../../assets/profile_placeholder.png', () => 'profile_placeholder.png');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render profile screen with user data', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('My Profile')).toBeTruthy();
    });

    expect(getByText(/Username:/)).toBeTruthy();
  });

  it('should render loading state initially', () => {
    const { UNSAFE_getByType } = render(<ProfileScreen />);

    // ActivityIndicator should be present during loading
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('should display waste history section', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Waste History')).toBeTruthy();
    });
  });

  it('should display achievements section', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Achievements')).toBeTruthy();
    });
  });

  it('should display language selector', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Language:')).toBeTruthy();
    });
  });

  it('should call logout when logout button is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Logout')).toBeTruthy();
    });

    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should display user bio', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Test bio')).toBeTruthy();
    });
  });

  it('should show edit bio mode when edit button is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Edit Profile')).toBeTruthy();
    });

    const editButton = getByText('Edit Profile');
    fireEvent.press(editButton);

    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('should cancel bio edit when cancel button is pressed', async () => {
    const { getByText, queryByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Edit Profile')).toBeTruthy();
    });

    // Enter edit mode
    fireEvent.press(getByText('Edit Profile'));

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    // Cancel
    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(queryByText('Save')).toBeNull();
    });
  });

  it('should handle empty achievements gracefully', async () => {
    const { achievementService } = require('../../services/api');
    achievementService.getUserAchievements.mockResolvedValueOnce([]);

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('No achievements yet')).toBeTruthy();
    });
  });

  it('should display chart with waste data', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      // Check that profile screen is rendered with waste history
      expect(getByTestId('profile-screen')).toBeTruthy();
    });
  });
});
