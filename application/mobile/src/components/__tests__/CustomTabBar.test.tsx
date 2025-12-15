import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Image } from 'react-native';
import { CustomTabBar } from '../CustomTabBar';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.title': 'Home',
        'community.title': 'Community',
        'challenges.title': 'Challenges',
        'profile.title': 'Profile',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock assets
jest.mock('../../assets/home.png', () => 'home.png');
jest.mock('../../assets/community.png', () => 'community.png');
jest.mock('../../assets/challenge.png', () => 'challenge.png');
jest.mock('../../assets/profile.png', () => 'profile.png');

describe('CustomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all tabs', () => {
    const { getByText } = render(<CustomTabBar />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Community')).toBeTruthy();
    expect(getByText('Challenges')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('should render with default active tab', () => {
    const { getByText } = render(<CustomTabBar />);

    // Default activeTab is 'Tips', none of the tabs should be highlighted as active
    const homeTab = getByText('Home');
    expect(homeTab).toBeTruthy();
  });

  it('should render with specified active tab', () => {
    const { getByText } = render(<CustomTabBar activeTab="Home" />);

    const homeTab = getByText('Home');
    expect(homeTab).toBeTruthy();
  });

  it('should navigate to MainTabs with Home screen when Home tab is pressed', () => {
    const { getAllByLabelText } = render(<CustomTabBar />);

    const homeTabs = getAllByLabelText('Home tab');
    fireEvent.press(homeTabs[0]);

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Home' });
  });

  it('should navigate to MainTabs with Community screen when Community tab is pressed', () => {
    const { getAllByLabelText } = render(<CustomTabBar />);

    const communityTabs = getAllByLabelText('Community tab');
    fireEvent.press(communityTabs[0]);

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Community' });
  });

  it('should navigate to MainTabs with Challenges screen when Challenges tab is pressed', () => {
    const { getAllByLabelText } = render(<CustomTabBar />);

    const challengesTabs = getAllByLabelText('Challenges tab');
    fireEvent.press(challengesTabs[0]);

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Challenges' });
  });

  it('should navigate to MainTabs with Profile screen when Profile tab is pressed', () => {
    const { getAllByLabelText } = render(<CustomTabBar />);

    const profileTabs = getAllByLabelText('Profile tab');
    fireEvent.press(profileTabs[0]);

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Profile' });
  });

  it('should have proper accessibility labels', () => {
    const { getAllByLabelText } = render(<CustomTabBar />);

    expect(getAllByLabelText('Home tab').length).toBeGreaterThan(0);
    expect(getAllByLabelText('Community tab').length).toBeGreaterThan(0);
    expect(getAllByLabelText('Challenges tab').length).toBeGreaterThan(0);
    expect(getAllByLabelText('Profile tab').length).toBeGreaterThan(0);
  });

  it('should render tab icons', () => {
    const { UNSAFE_getAllByType } = render(<CustomTabBar />);

    // Should render 4 Image components for icons
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBe(4);
  });
});
