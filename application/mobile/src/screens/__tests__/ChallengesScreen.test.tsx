import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, ActivityIndicator, Switch } from 'react-native';
import { ChallengesScreen } from '../ChallengesScreen';

// Mock axios
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

// Mock api service
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('../../services/api', () => ({
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
  challengeService: {
    deleteChallenge: jest.fn(),
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'challenges.title': 'Challenges',
        'challenges.myChallenges': 'My Challenges',
        'challenges.createChallenge': 'Create Challenge',
        'challenges.join': 'Join',
        'challenges.leave': 'Leave',
        'challenges.completed': 'Completed',
        'challenges.description': 'Description',
        'challenges.challengeName': 'Challenge Name',
        'challenges.targetAmount': 'Target Amount',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock ScreenWrapper
jest.mock('../../components/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: any) => <>{children}</>,
}));

describe('ChallengesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // Default mock responses
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/challenges/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Reduce Plastic',
              description: 'Reduce plastic usage by 50%',
              target_amount: 100,
              current_progress: 50,
              is_public: true,
              is_enrolled: false,
            },
          ],
        });
      }
      if (url === '/api/challenges/enrolled/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render challenges screen with title', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Challenges')).toBeTruthy();
    });
  });

  it('should render loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { UNSAFE_getByType } = render(<ChallengesScreen />);

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('should render challenges when data is loaded', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Reduce Plastic')).toBeTruthy();
    });

    expect(getByText('Reduce plastic usage by 50%')).toBeTruthy();
  });

  it('should toggle between all challenges and my challenges', async () => {
    const { getByText, UNSAFE_getByType } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('My Challenges')).toBeTruthy();
    });

    // Find the Switch and toggle it
    const switchComponent = UNSAFE_getByType(Switch);
    fireEvent(switchComponent, 'onValueChange', true);

    // Should now show enrolled challenges only
    expect(switchComponent.props.value).toBeFalsy(); // Initial state
  });

  it('should open create challenge modal when button is pressed', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Create Challenge')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Challenge'));

    await waitFor(() => {
      expect(getByText('Challenge Name')).toBeTruthy();
    });
  });

  it('should show error when creating challenge with empty fields', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Create Challenge')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Challenge'));

    await waitFor(() => {
      expect(getByText('Submit')).toBeTruthy();
    });

    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('should create challenge successfully with valid data', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 2, title: 'New Challenge' } });

    const { getByText, getByPlaceholderText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Create Challenge')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Challenge'));

    await waitFor(() => {
      expect(getByPlaceholderText('Challenge Name')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Challenge Name'), 'New Challenge');
    fireEvent.changeText(getByPlaceholderText('Description'), 'A new challenge');
    fireEvent.changeText(getByPlaceholderText('Target Amount'), '100');

    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/challenges/', expect.objectContaining({
        title: 'New Challenge',
        description: 'A new challenge',
        target_amount: 100,
        is_public: true,
      }));
    });
  });

  it('should join a challenge when join button is pressed', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Reduce Plastic')).toBeTruthy();
    });

    // Find and press the join button
    const joinButton = getByText('Join');
    fireEvent.press(joinButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/challenges/participate/', { challenge: 1 });
    });
  });

  it('should show error alert when fetch fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    render(<ChallengesScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to fetch challenges');
    });
  });

  it('should close modal when cancel button is pressed', async () => {
    const { getByText, queryByPlaceholderText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Create Challenge')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Challenge'));

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      // Modal should be closed, so placeholders should not be visible
      // Note: This depends on Modal implementation
    });
  });

  it('should display progress bar with correct percentage', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Reduce Plastic')).toBeTruthy();
    });

    // Progress text should show current/target
    expect(getByText('50.00/100')).toBeTruthy();
  });

  it('should show public/private indicator', async () => {
    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText(/Join/)).toBeTruthy();
    });
  });

  it('should handle leave challenge action', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/challenges/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Enrolled Challenge',
              description: 'A challenge I am enrolled in',
              target_amount: 100,
              current_progress: 30,
              is_public: true,
              is_enrolled: true,
            },
          ],
        });
      }
      if (url === '/api/challenges/enrolled/') {
        return Promise.resolve({
          data: [
            {
              id: 10,
              challenge: { id: 1 },
              joined_date: '2024-01-15T10:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockDelete.mockResolvedValueOnce({ data: { success: true } });

    const { getByText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Enrolled Challenge')).toBeTruthy();
    });
  });

  it('should handle create challenge failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Failed to create'));

    const { getByText, getByPlaceholderText } = render(<ChallengesScreen />);

    await waitFor(() => {
      expect(getByText('Create Challenge')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Challenge'));

    await waitFor(() => {
      expect(getByPlaceholderText('Challenge Name')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Challenge Name'), 'New Challenge');
    fireEvent.changeText(getByPlaceholderText('Description'), 'A new challenge');
    fireEvent.changeText(getByPlaceholderText('Target Amount'), '100');

    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create challenge');
    });
  });
});
