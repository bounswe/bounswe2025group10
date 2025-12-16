import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock axios first
jest.mock('axios', () => ({
  get: jest.fn(),
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

// Mock context and navigation
const mockLogout = jest.fn();
const mockNavigateToScreen = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
    userData: { email: 'test@example.com', username: 'testuser' },
    isAuthenticated: true,
    isAdmin: false,
    login: jest.fn(),
    fetchUserData: jest.fn(),
  }),
}));

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
const { HomeScreen } = require('../HomeScreen');
const { wasteService, tipService } = require('../../services/api');
const { SCREEN_NAMES } = require('../../hooks/useNavigation');

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // Reset mocks
    wasteService.getUserWastes = jest.fn();
    wasteService.addUserWaste = jest.fn();
    tipService.getRecentTips = jest.fn();

    // Mock waste data
    wasteService.getUserWastes.mockResolvedValue({
      data: [
        { waste_type: 'PLASTIC', total_amount: 10 },
        { waste_type: 'PAPER', total_amount: 5 },
      ],
    });

    // Mock tips
    tipService.getRecentTips.mockResolvedValue({
      data: [
        { id: 1, title: 'Tip 1', description: 'Description 1', like_count: 5, dislike_count: 1 },
        { id: 2, title: 'Tip 2', description: 'Description 2', like_count: 3, dislike_count: 0 },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render home screen correctly', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText(/Hello, testuser/)).toBeTruthy();
      expect(getByText('Your Progress')).toBeTruthy();
      expect(getByText('Latest Tips')).toBeTruthy();
    });
  });

  it('should display user greeting', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Hello, testuser')).toBeTruthy();
    });
  });

  it('should display loading message when userData is null', () => {
    // Temporarily mock useAuth to return null userData
    const originalMock = require('../../context/AuthContext');
    const spy = jest.spyOn(originalMock, 'useAuth').mockReturnValue({
      logout: mockLogout,
      userData: null,
      isAuthenticated: true,
      isAdmin: false,
      login: jest.fn(),
      fetchUserData: jest.fn(),
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('Loading...')).toBeTruthy();
    
    // Restore original mock
    spy.mockRestore();
  });

  it('should load and display waste data', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(wasteService.getUserWastes).toHaveBeenCalled();
    });
  });

  it('should load and display tips', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(tipService.getRecentTips).toHaveBeenCalled();
      expect(getByText('Tip 1')).toBeTruthy();
      expect(getByText('Tip 2')).toBeTruthy();
    });
  });

  it('should not add waste when no waste type is selected', async () => {
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    const quantityInput = getByPlaceholderText('Quantity (kg)');
    fireEvent.changeText(quantityInput, '5');

    const addButton = getByText('Add');
    
    // Pressing button without waste type selection should not call the service
    fireEvent.press(addButton);
    expect(wasteService.addUserWaste).not.toHaveBeenCalled();
  });

  it('should not add waste when no quantity is entered', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    // Open waste type modal
    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      const plasticOption = getByText('Plastic');
      fireEvent.press(plasticOption);
    });

    const addButton = getByText('Add');
    
    // Pressing button without quantity should not call the service
    fireEvent.press(addButton);
    expect(wasteService.addUserWaste).not.toHaveBeenCalled();
  });

  it('should show alert when entering invalid quantity', async () => {
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    // Select waste type
    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      const plasticOption = getByText('Plastic');
      fireEvent.press(plasticOption);
    });

    const quantityInput = getByPlaceholderText('Quantity (kg)');
    fireEvent.changeText(quantityInput, '-5');

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid quantity (positive number)');
    });
  });

  it('should successfully add waste entry', async () => {
    wasteService.addUserWaste.mockResolvedValueOnce({ message: 'Success' });

    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    // Select waste type
    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      const plasticOption = getByText('Plastic');
      fireEvent.press(plasticOption);
    });

    const quantityInput = getByPlaceholderText('Quantity (kg)');
    fireEvent.changeText(quantityInput, '5');

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(wasteService.addUserWaste).toHaveBeenCalledWith('PLASTIC', 5);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Waste entry added successfully!');
    });
  });

  it('should refresh waste data after adding entry', async () => {
    wasteService.addUserWaste.mockResolvedValueOnce({ message: 'Success' });

    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    const initialCalls = wasteService.getUserWastes.mock.calls.length;

    // Select waste type and add
    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      const plasticOption = getByText('Plastic');
      fireEvent.press(plasticOption);
    });

    const quantityInput = getByPlaceholderText('Quantity (kg)');
    fireEvent.changeText(quantityInput, '5');

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    await waitFor(() => {
      // Should be called again to refresh data
      expect(wasteService.getUserWastes).toHaveBeenCalledTimes(initialCalls + 1);
    });
  });

  it('should show error alert when adding waste fails', async () => {
    const error = {
      response: {
        data: { error: 'Invalid waste type' },
      },
    };
    wasteService.addUserWaste.mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Your Progress')).toBeTruthy();
    });

    // Select waste type
    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      const plasticOption = getByText('Plastic');
      fireEvent.press(plasticOption);
    });

    const quantityInput = getByPlaceholderText('Quantity (kg)');
    fireEvent.changeText(quantityInput, '5');

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        expect.stringContaining('Failed to add waste entry')
      );
    });
  });

  it('should navigate to Tips screen when Tips is pressed in dropdown', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('home-more-dropdown')).toBeTruthy();
    });

    const dropdown = getByTestId('home-more-dropdown');
    fireEvent.press(dropdown);

    await waitFor(() => {
      const tipsItem = getByTestId('home-more-dropdown-item-tips');
      fireEvent.press(tipsItem);
    });

    expect(mockNavigateToScreen).toHaveBeenCalledWith(SCREEN_NAMES.TIPS);
  });

  it('should navigate to Achievements screen when Achievements is pressed', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      const dropdown = getByTestId('home-more-dropdown');
      fireEvent.press(dropdown);
    });

    await waitFor(() => {
      const achievementsItem = getByTestId('home-more-dropdown-item-achievements');
      fireEvent.press(achievementsItem);
    });

    expect(mockNavigateToScreen).toHaveBeenCalledWith(SCREEN_NAMES.ACHIEVEMENTS);
  });

  it('should navigate to Leaderboard screen when Leaderboard is pressed', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      const dropdown = getByTestId('home-more-dropdown');
      fireEvent.press(dropdown);
    });

    await waitFor(() => {
      const leaderboardItem = getByTestId('home-more-dropdown-item-leaderboard');
      fireEvent.press(leaderboardItem);
    });

    expect(mockNavigateToScreen).toHaveBeenCalledWith(SCREEN_NAMES.LEADERBOARD);
  });

  it('should call logout when logout button is pressed', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Logout')).toBeTruthy();
    });

    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should display tip statistics correctly', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('👍 5')).toBeTruthy();
      expect(getByText('👎 1')).toBeTruthy();
      expect(getByText('👍 3')).toBeTruthy();
      expect(getByText('👎 0')).toBeTruthy();
    });
  });

  it('should show empty tips message when no tips available', async () => {
    tipService.getRecentTips.mockResolvedValueOnce({ data: [] });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('No tips available. Be the first to add one!')).toBeTruthy();
    });
  });

  it('should open waste type modal when waste type button is pressed', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Select waste type')).toBeTruthy();
    });

    const wasteTypeButton = getByText('Select waste type');
    fireEvent.press(wasteTypeButton);

    await waitFor(() => {
      expect(getByText('Select Waste Type')).toBeTruthy();
      expect(getByText('Plastic')).toBeTruthy();
      expect(getByText('Paper')).toBeTruthy();
      expect(getByText('Glass')).toBeTruthy();
      expect(getByText('Metal')).toBeTruthy();
    });
  });

  it('should close waste type modal when Cancel is pressed', async () => {
    const { getByText, queryByText } = render(<HomeScreen />);

    await waitFor(() => {
      const wasteTypeButton = getByText('Select waste type');
      fireEvent.press(wasteTypeButton);
    });

    await waitFor(() => {
      expect(getByText('Select Waste Type')).toBeTruthy();
    });

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('Select Waste Type')).toBeNull();
    });
  });
});

