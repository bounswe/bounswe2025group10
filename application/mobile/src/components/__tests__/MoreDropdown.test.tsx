import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MoreDropdown } from '../MoreDropdown';

describe('MoreDropdown', () => {
  const mockOnTipsPress = jest.fn();
  const mockOnAchievementsPress = jest.fn();
  const mockOnLeaderboardPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the More button', () => {
    const { getByText } = render(<MoreDropdown />);
    
    expect(getByText('More')).toBeTruthy();
  });

  it('should not show menu initially', () => {
    const { queryByText } = render(<MoreDropdown />);
    
    expect(queryByText('Tips')).toBeNull();
    expect(queryByText('Achievements')).toBeNull();
    expect(queryByText('Leaderboard')).toBeNull();
  });

  it('should show menu when More button is pressed', async () => {
    const { getByText, getByTestId } = render(<MoreDropdown />);

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      expect(getByText('Tips')).toBeTruthy();
      expect(getByText('Achievements')).toBeTruthy();
      expect(getByText('Leaderboard')).toBeTruthy();
    });
  });

  it('should call onTipsPress when Tips item is pressed', async () => {
    const { getByTestId } = render(
      <MoreDropdown onTipsPress={mockOnTipsPress} />
    );

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      const tipsItem = getByTestId('more-dropdown-item-tips');
      fireEvent.press(tipsItem);
    });

    expect(mockOnTipsPress).toHaveBeenCalledTimes(1);
  });

  it('should call onAchievementsPress when Achievements item is pressed', async () => {
    const { getByTestId } = render(
      <MoreDropdown onAchievementsPress={mockOnAchievementsPress} />
    );

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      const achievementsItem = getByTestId('more-dropdown-item-achievements');
      fireEvent.press(achievementsItem);
    });

    expect(mockOnAchievementsPress).toHaveBeenCalledTimes(1);
  });

  it('should call onLeaderboardPress when Leaderboard item is pressed', async () => {
    const { getByTestId } = render(
      <MoreDropdown onLeaderboardPress={mockOnLeaderboardPress} />
    );

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      const leaderboardItem = getByTestId('more-dropdown-item-leaderboard');
      fireEvent.press(leaderboardItem);
    });

    expect(mockOnLeaderboardPress).toHaveBeenCalledTimes(1);
  });

  it('should close menu after selecting an item', async () => {
    const { getByTestId, queryByText } = render(
      <MoreDropdown onTipsPress={mockOnTipsPress} />
    );

    // Open menu
    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      expect(queryByText('Tips')).toBeTruthy();
    });

    // Press tips item
    const tipsItem = getByTestId('more-dropdown-item-tips');
    fireEvent.press(tipsItem);

    // Menu should be closed
    await waitFor(() => {
      expect(queryByText('Tips')).toBeNull();
    });
  });

  it('should render menu items with correct icons', async () => {
    const { getByTestId, getByText } = render(<MoreDropdown />);

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      expect(getByText('💡')).toBeTruthy(); // Tips icon
      expect(getByText('🏆')).toBeTruthy(); // Achievements icon
      expect(getByText('📊')).toBeTruthy(); // Leaderboard icon
    });
  });

  it('should render menu items with correct accessibility labels', async () => {
    const { getByTestId } = render(<MoreDropdown />);

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      const tipsItem = getByTestId('more-dropdown-item-tips');
      const achievementsItem = getByTestId('more-dropdown-item-achievements');
      const leaderboardItem = getByTestId('more-dropdown-item-leaderboard');

      expect(tipsItem.props.accessibilityLabel).toBe('Tips');
      expect(achievementsItem.props.accessibilityLabel).toBe('Achievements');
      expect(leaderboardItem.props.accessibilityLabel).toBe('Leaderboard');
    });
  });

  it('should have correct accessibility props for More button', () => {
    const { getByTestId } = render(<MoreDropdown />);

    const moreButton = getByTestId('more-dropdown');
    expect(moreButton.props.accessibilityLabel).toBe('More options');
    expect(moreButton.props.accessibilityRole).toBe('button');
    expect(moreButton.props.accessibilityHint).toBe('Opens a menu with additional options');
  });

  it('should render with custom testID', () => {
    const { getByTestId } = render(<MoreDropdown testID="custom-dropdown" />);
    
    expect(getByTestId('custom-dropdown')).toBeTruthy();
  });

  it('should handle missing callback gracefully', async () => {
    const { getByTestId } = render(<MoreDropdown />);

    fireEvent.press(getByTestId('more-dropdown'));

    await waitFor(() => {
      const tipsItem = getByTestId('more-dropdown-item-tips');
      // Should not throw error when pressing without callback
      expect(() => fireEvent.press(tipsItem)).not.toThrow();
    });
  });
});

