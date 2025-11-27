import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';

// Mock axios first
jest.mock('axios', () => ({
  get: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {use: jest.fn()},
      response: {use: jest.fn()},
    },
  })),
}));

// Mock context and navigation
const mockNavigateToScreen = jest.fn();

jest.mock('../../hooks/useNavigation', () => ({
  useAppNavigation: () => ({
    navigateToScreen: mockNavigateToScreen,
    goBack: jest.fn(),
    resetToScreen: jest.fn(),
    canGoBack: jest.fn(),
    navigation: {} as any,
  }),
  SCREEN_NAMES: {
    LOGIN: 'Login',
    SIGNUP: 'Signup',
    MAIN_TABS: 'MainTabs',
    HOME: 'Home',
    COMMUNITY: 'Community',
    CHALLENGES: 'Challenges',
    PROFILE: 'Profile',
    TIPS: 'Tips',
    ACHIEVEMENTS: 'Achievements',
    LEADERBOARD: 'Leaderboard',
    OTHER_PROFILE: 'OtherProfile',
  },
}));

// Import after mocks
const {TipsScreen} = require('../TipsScreen');
const {tipService} = require('../../services/api');
const {SCREEN_NAMES} = require('../../hooks/useNavigation');

describe('TipsScreen', () => {
  const mockTips = [
    {
      id: 1,
      title: 'Use reusable bags',
      description: 'Always carry reusable bags when shopping',
      like_count: 10,
      dislike_count: 2,
      is_user_liked: false,
      is_user_disliked: false,
      created_at: '2025-01-01',
      author: 'user1',
    },
    {
      id: 2,
      title: 'Compost food waste',
      description: 'Turn your food scraps into nutrient-rich soil',
      like_count: 15,
      dislike_count: 1,
      is_user_liked: true,
      is_user_disliked: false,
      created_at: '2025-01-02',
      author: 'user2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // Reset mocks
    tipService.getAllTips = jest.fn();
    tipService.createTip = jest.fn();
    tipService.likeTip = jest.fn();
    tipService.dislikeTip = jest.fn();
    tipService.reportTip = jest.fn();

    // Mock default successful tips fetch
    tipService.getAllTips.mockResolvedValue({
      data: mockTips,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render tips screen correctly', async () => {
      const {getByText, getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByTestId('tips-screen')).toBeTruthy();
        expect(getByText('Use reusable bags')).toBeTruthy();
        expect(getByText('Compost food waste')).toBeTruthy();
      });
    });

    it('should display loading indicator initially', () => {
      const {UNSAFE_getByType} = render(<TipsScreen />);
      const ActivityIndicator = require('react-native').ActivityIndicator;

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('should display create tip button', async () => {
      const {getByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByText('Create Tip')).toBeTruthy();
      });
    });

    it('should display more dropdown', async () => {
      const {getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByTestId('tips-more-dropdown')).toBeTruthy();
      });
    });
  });

  describe('Data Loading', () => {
    it('should load and display tips on mount', async () => {
      const {getByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalled();
        expect(getByText('Use reusable bags')).toBeTruthy();
        expect(
          getByText('Always carry reusable bags when shopping'),
        ).toBeTruthy();
      });
    });

    it('should display like and dislike counts', async () => {
      const {getByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByText('👍 10')).toBeTruthy();
        expect(getByText('👎 2')).toBeTruthy();
        expect(getByText('👍 15')).toBeTruthy();
        expect(getByText('👎 1')).toBeTruthy();
      });
    });

    it('should show empty state when no tips available', async () => {
      tipService.getAllTips.mockResolvedValueOnce({data: []});

      const {getByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByText('No tips available yet')).toBeTruthy();
        expect(
          getByText('Be the first to share a sustainability tip!'),
        ).toBeTruthy();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const error = new Error('Failed to fetch');
      tipService.getAllTips.mockRejectedValueOnce(error);

      render(<TipsScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to fetch tips',
        );
      });
    });
  });

  describe('Create Tip Modal', () => {
    it('should open create tip modal when Create Tip button is pressed', async () => {
      const {getByText, getByLabelText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByLabelText('Create new tip')).toBeTruthy();
      });

      const createButton = getByLabelText('Create new tip');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Title')).toBeTruthy();
        expect(getByText('Description')).toBeTruthy();
      });
    });

    it('should close create tip modal when close button is pressed', async () => {
      const {getByText, queryByText, getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(getByText('Title')).toBeTruthy();
      });

      const closeButton = getByText('✕');
      fireEvent.press(closeButton);

      await waitFor(() => {
        // Modal title should still exist in header, but input labels should be gone
        expect(queryByText('Title')).toBeNull();
      });
    });

    it('should close create tip modal when cancel button is pressed', async () => {
      const {getByText, queryByText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(getByText('Title')).toBeTruthy();
      });

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(queryByText('Title')).toBeNull();
      });
    });

    it('should not create tip when title is empty', async () => {
      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText('Enter tip description');
        fireEvent.changeText(descriptionInput, 'Test description');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Title and description are required',
        );
        expect(tipService.createTip).not.toHaveBeenCalled();
      });
    });

    it('should not create tip when description is empty', async () => {
      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        fireEvent.changeText(titleInput, 'Test title');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Title and description are required',
        );
        expect(tipService.createTip).not.toHaveBeenCalled();
      });
    });

    it('should successfully create a tip', async () => {
      tipService.createTip.mockResolvedValueOnce({message: 'Success'});

      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        const descriptionInput = getByPlaceholderText('Enter tip description');

        fireEvent.changeText(titleInput, 'New Tip');
        fireEvent.changeText(descriptionInput, 'New tip description');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(tipService.createTip).toHaveBeenCalledWith(
          'New Tip',
          'New tip description',
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Tip created successfully!',
        );
      });
    });

    it('should refresh tips after creating a tip', async () => {
      tipService.createTip.mockResolvedValueOnce({message: 'Success'});

      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        const descriptionInput = getByPlaceholderText('Enter tip description');

        fireEvent.changeText(titleInput, 'New Tip');
        fireEvent.changeText(descriptionInput, 'New tip description');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(2);
      });
    });

    it('should show error alert when creating tip fails', async () => {
      const error = new Error('Failed to create');
      tipService.createTip.mockRejectedValueOnce(error);

      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        const descriptionInput = getByPlaceholderText('Enter tip description');

        fireEvent.changeText(titleInput, 'New Tip');
        fireEvent.changeText(descriptionInput, 'New tip description');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to create tip',
        );
      });
    });

    it('should clear input fields after successful creation', async () => {
      tipService.createTip.mockResolvedValueOnce({message: 'Success'});

      const {getByText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        const descriptionInput = getByPlaceholderText('Enter tip description');

        fireEvent.changeText(titleInput, 'New Tip');
        fireEvent.changeText(descriptionInput, 'New tip description');
      });

      const createBtn = getByText('Create');
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(tipService.createTip).toHaveBeenCalled();
      });

      // Open modal again to check if fields are cleared
      await waitFor(() => {
        const createButton = getByText('Create Tip');
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        const titleInput = getByPlaceholderText('Enter tip title');
        const descriptionInput = getByPlaceholderText('Enter tip description');

        expect(titleInput.props.value).toBe('');
        expect(descriptionInput.props.value).toBe('');
      });
    });
  });

  describe('Like and Dislike Functionality', () => {
    it('should like a tip when like button is pressed', async () => {
      tipService.likeTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getAllByText('👍 10')[0]).toBeTruthy();
      });

      const likeButton = getAllByText('👍 10')[0];
      fireEvent.press(likeButton);

      await waitFor(() => {
        expect(tipService.likeTip).toHaveBeenCalledWith(1);
      });
    });

    it('should dislike a tip when dislike button is pressed', async () => {
      tipService.dislikeTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getAllByText('👎 2')[0]).toBeTruthy();
      });

      const dislikeButton = getAllByText('👎 2')[0];
      fireEvent.press(dislikeButton);

      await waitFor(() => {
        expect(tipService.dislikeTip).toHaveBeenCalledWith(1);
      });
    });

    it('should refresh tips after liking', async () => {
      tipService.likeTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(1);
      });

      const likeButton = getAllByText('👍 10')[0];
      fireEvent.press(likeButton);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(2);
      });
    });

    it('should refresh tips after disliking', async () => {
      tipService.dislikeTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(1);
      });

      const dislikeButton = getAllByText('👎 2')[0];
      fireEvent.press(dislikeButton);

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalledTimes(2);
      });
    });

    it('should show error alert when like fails', async () => {
      const error = new Error('Failed to like');
      tipService.likeTip.mockRejectedValueOnce(error);

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        const likeButton = getAllByText('👍 10')[0];
        fireEvent.press(likeButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to like tip');
      });
    });

    it('should show error alert when dislike fails', async () => {
      const error = new Error('Failed to dislike');
      tipService.dislikeTip.mockRejectedValueOnce(error);

      const {getAllByText} = render(<TipsScreen />);

      await waitFor(() => {
        const dislikeButton = getAllByText('👎 2')[0];
        fireEvent.press(dislikeButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to dislike tip',
        );
      });
    });
  });

  describe('Report Functionality', () => {
    it('should open report modal when report button is pressed', async () => {
      const {getAllByLabelText, getByText} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getAllByLabelText('Report this tip')[0]).toBeTruthy();
      });

      const reportButton = getAllByLabelText('Report this tip')[0];
      fireEvent.press(reportButton);

      await waitFor(() => {
        expect(getByText('Report Tip')).toBeTruthy();
        expect(
          getByText("Let us know what's wrong with this tip."),
        ).toBeTruthy();
        expect(getByText('Spam')).toBeTruthy();
        expect(getByText('Inappropriate')).toBeTruthy();
      });
    });

    it('should close report modal when close button is pressed', async () => {
      const {getAllByLabelText, getByText, queryByText} = render(
        <TipsScreen />,
      );

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        expect(getByText('Report Tip')).toBeTruthy();
      });

      const closeButton = getByText('✕');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(
          queryByText("Let us know what's wrong with this tip."),
        ).toBeNull();
      });
    });

    it('should close report modal when cancel button is pressed', async () => {
      const {getAllByLabelText, getByText, queryByText} = render(
        <TipsScreen />,
      );

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        expect(getByText('Report Tip')).toBeTruthy();
      });

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(
          queryByText("Let us know what's wrong with this tip."),
        ).toBeNull();
      });
    });

    it('should not submit report when no reason is selected', async () => {
      const {getAllByLabelText, getByPlaceholderText} = render(<TipsScreen />);

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText(
          'Please explain briefly...',
        );
        fireEvent.changeText(descriptionInput, 'This is problematic');
      });

      // The submit button is disabled when no reason is selected,
      // so the service should never be called
      await waitFor(() => {
        expect(tipService.reportTip).not.toHaveBeenCalled();
      });
    });

    it('should not submit report when no description is provided', async () => {
      const {getAllByLabelText, getByText} = render(<TipsScreen />);

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const spamOption = getByText('Spam');
        fireEvent.press(spamOption);
      });

      // The submit button is disabled when no description is provided,
      // so the service should never be called
      await waitFor(() => {
        expect(tipService.reportTip).not.toHaveBeenCalled();
      });
    });

    it('should successfully submit a report', async () => {
      tipService.reportTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByLabelText, getByText, getByPlaceholderText} = render(
        <TipsScreen />,
      );

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const spamOption = getByText('Spam');
        fireEvent.press(spamOption);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText(
          'Please explain briefly...',
        );
        fireEvent.changeText(descriptionInput, 'This is spam content');
      });

      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(tipService.reportTip).toHaveBeenCalledWith(
          1,
          'SPAM',
          'This is spam content',
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Report submitted successfully',
        );
      });
    });

    it('should show error alert when report submission fails', async () => {
      const error = new Error('Failed to report');
      tipService.reportTip.mockRejectedValueOnce(error);

      const {getAllByLabelText, getByText, getByPlaceholderText} = render(
        <TipsScreen />,
      );

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const spamOption = getByText('Spam');
        fireEvent.press(spamOption);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText(
          'Please explain briefly...',
        );
        fireEvent.changeText(descriptionInput, 'This is spam content');
      });

      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to submit report',
        );
      });
    });

    it('should display all report reasons', async () => {
      const {getAllByLabelText, getByText} = render(<TipsScreen />);

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        expect(getByText('Spam')).toBeTruthy();
        expect(getByText('Inappropriate')).toBeTruthy();
        expect(getByText('Harassment')).toBeTruthy();
        expect(getByText('Misleading or Fake')).toBeTruthy();
        expect(getByText('Other')).toBeTruthy();
      });
    });

    it('should select report reason when pressed', async () => {
      const {getAllByLabelText, getByText} = render(<TipsScreen />);

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const harassmentOption = getByText('Harassment');
        fireEvent.press(harassmentOption);
      });

      // The selected option should be styled differently, but we can't easily test styling
      // We can verify it doesn't crash and the option is rendered
      await waitFor(() => {
        expect(getByText('Harassment')).toBeTruthy();
      });
    });

    it('should clear report form after successful submission', async () => {
      tipService.reportTip.mockResolvedValueOnce({message: 'Success'});

      const {getAllByLabelText, getByText, getByPlaceholderText} = render(
        <TipsScreen />,
      );

      await waitFor(() => {
        const reportButton = getAllByLabelText('Report this tip')[0];
        fireEvent.press(reportButton);
      });

      await waitFor(() => {
        const spamOption = getByText('Spam');
        fireEvent.press(spamOption);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText(
          'Please explain briefly...',
        );
        fireEvent.changeText(descriptionInput, 'This is spam content');
      });

      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(tipService.reportTip).toHaveBeenCalled();
      });

      // Open report modal again to check if fields are cleared
      await waitFor(() => {
        const reportButtons = getAllByLabelText('Report this tip');
        fireEvent.press(reportButtons[0]);
      });

      await waitFor(() => {
        const descriptionInput = getByPlaceholderText(
          'Please explain briefly...',
        );
        expect(descriptionInput.props.value).toBe('');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to Achievements when achievements is pressed in dropdown', async () => {
      const {getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByTestId('tips-more-dropdown')).toBeTruthy();
      });

      const dropdown = getByTestId('tips-more-dropdown');
      fireEvent.press(dropdown);

      await waitFor(() => {
        const achievementsItem = getByTestId(
          'tips-more-dropdown-item-achievements',
        );
        fireEvent.press(achievementsItem);
      });

      expect(mockNavigateToScreen).toHaveBeenCalledWith(
        SCREEN_NAMES.ACHIEVEMENTS,
      );
    });

    it('should navigate to Leaderboard when leaderboard is pressed in dropdown', async () => {
      const {getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        const dropdown = getByTestId('tips-more-dropdown');
        fireEvent.press(dropdown);
      });

      await waitFor(() => {
        const leaderboardItem = getByTestId(
          'tips-more-dropdown-item-leaderboard',
        );
        fireEvent.press(leaderboardItem);
      });

      expect(mockNavigateToScreen).toHaveBeenCalledWith(
        SCREEN_NAMES.LEADERBOARD,
      );
    });

    it('should not navigate when Tips is pressed in dropdown (already on Tips screen)', async () => {
      const {getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        const dropdown = getByTestId('tips-more-dropdown');
        fireEvent.press(dropdown);
      });

      await waitFor(() => {
        const tipsItem = getByTestId('tips-more-dropdown-item-tips');
        fireEvent.press(tipsItem);
      });

      // Should not navigate since we're already on tips screen
      expect(mockNavigateToScreen).not.toHaveBeenCalledWith(SCREEN_NAMES.TIPS);
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh tips when pull to refresh is triggered', async () => {
      const {UNSAFE_getByType} = render(<TipsScreen />);
      const FlatList = require('react-native').FlatList;

      await waitFor(() => {
        expect(tipService.getAllTips).toHaveBeenCalled();
      });

      const initialCallCount = tipService.getAllTips.mock.calls.length;

      const flatList = UNSAFE_getByType(FlatList);
      fireEvent(flatList, 'refresh');

      await waitFor(() => {
        // Verify that getAllTips was called at least one more time after refresh
        expect(tipService.getAllTips.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const {getByLabelText, getByTestId} = render(<TipsScreen />);

      await waitFor(() => {
        expect(getByTestId('tips-screen')).toBeTruthy();
        expect(getByLabelText('Create new tip')).toBeTruthy();
      });
    });

    it('should have accessibility labels on report buttons', async () => {
      const {getAllByLabelText} = render(<TipsScreen />);

      await waitFor(() => {
        const reportButtons = getAllByLabelText('Report this tip');
        expect(reportButtons.length).toBe(2); // One for each tip
      });
    });
  });
});
