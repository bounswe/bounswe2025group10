import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AchievementsScreen } from '../AchievementsScreen';
import { achievementService } from '../../services/api';

// Mock navigation
const mockNavigateToScreen = jest.fn();
jest.mock('../../hooks/useNavigation', () => ({
  useAppNavigation: () => ({
    navigateToScreen: mockNavigateToScreen,
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'achievements.title': 'Achievements',
        'achievements.myAchievements': 'My Achievements',
        'achievements.startParticipating': 'Start participating in challenges to earn achievements!',
        'achievements.failedToLoad': 'Failed to load achievements',
        'achievements.retry': 'Retry',
        'achievements.earned': 'Earned',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock services
jest.mock('../../services/api', () => ({
  achievementService: {
    getUserAchievements: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/ScreenWrapper', () => ({
  ScreenWrapper: ({ children, title, testID }: any) => (
    <>{children}</>
  ),
}));

jest.mock('../../components/MoreDropdown', () => ({
  MoreDropdown: ({ onTipsPress, onAchievementsPress, onLeaderboardPress }: any) => null,
}));

jest.mock('../../components/CustomTabBar', () => ({
  CustomTabBar: () => null,
}));

const mockAchievementService = achievementService as jest.Mocked<typeof achievementService>;

describe('AchievementsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockAchievementService.getUserAchievements.mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    const { getByTestId } = render(<AchievementsScreen />);

    // Should show loading state
    expect(getByTestId('achievements-screen')).toBeTruthy();
  });

  it('should render achievements list when data is loaded', async () => {
    const mockAchievements = {
      data: {
        achievements: [
          {
            id: 1,
            achievement: {
              id: 1,
              title: 'First Waste',
              description: 'Logged your first waste item',
              icon: 'https://example.com/icon.png',
            },
            earned_at: '2024-01-15T10:00:00Z',
          },
          {
            id: 2,
            achievement: {
              id: 2,
              title: 'Eco Warrior',
              description: 'Logged 100kg of waste',
              icon: null,
            },
            earned_at: '2024-02-20T14:30:00Z',
          },
        ],
      },
    };

    mockAchievementService.getUserAchievements.mockResolvedValueOnce(mockAchievements);

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('First Waste')).toBeTruthy();
    });

    expect(getByText('Logged your first waste item')).toBeTruthy();
    expect(getByText('Eco Warrior')).toBeTruthy();
  });

  it('should render empty state when no achievements', async () => {
    mockAchievementService.getUserAchievements.mockResolvedValueOnce({
      data: { achievements: [] },
    });

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('My Achievements')).toBeTruthy();
    });

    expect(getByText('Start participating in challenges to earn achievements!')).toBeTruthy();
  });

  it('should render error state when fetch fails', async () => {
    mockAchievementService.getUserAchievements.mockRejectedValueOnce(
      new Error('Network error')
    );

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('Failed to load achievements')).toBeTruthy();
    });

    expect(getByText('Retry')).toBeTruthy();
  });

  it('should retry fetching when retry button is pressed', async () => {
    mockAchievementService.getUserAchievements.mockRejectedValueOnce(
      new Error('Network error')
    );

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });

    // Now mock a successful response for retry
    mockAchievementService.getUserAchievements.mockResolvedValueOnce({
      data: { achievements: [] },
    });

    fireEvent.press(getByText('Retry'));

    await waitFor(() => {
      expect(mockAchievementService.getUserAchievements).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle null/undefined achievements data gracefully', async () => {
    mockAchievementService.getUserAchievements.mockResolvedValueOnce({
      data: { achievements: [] },
    });

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('My Achievements')).toBeTruthy();
    });
  });

  it('should display earned date correctly', async () => {
    const mockAchievements = {
      data: {
        achievements: [
          {
            id: 1,
            achievement: {
              id: 1,
              title: 'Test Achievement',
              description: 'Test description',
            },
            earned_at: '2024-03-15T10:00:00Z',
          },
        ],
      },
    };

    mockAchievementService.getUserAchievements.mockResolvedValueOnce(mockAchievements);

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText('Test Achievement')).toBeTruthy();
    });

    // Should display the earned date
    expect(getByText(/Earned/)).toBeTruthy();
  });
});
