import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppHeader } from '../AppHeader';

// Mock react-navigation before importing component
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
}));

describe('AppHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  it('should render correctly with title', () => {
    const { getByText } = render(<AppHeader title="Test Title" />);
    
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should not show back button by default', () => {
    const { queryByTestId } = render(<AppHeader title="Test" />);
    
    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should show back button when showBackButton is true', () => {
    const { getByTestId } = render(<AppHeader title="Test" showBackButton />);
    
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should call custom onBackPress when back button is pressed', () => {
    const onBackPress = jest.fn();
    const { getByTestId } = render(
      <AppHeader title="Test" showBackButton onBackPress={onBackPress} />
    );

    fireEvent.press(getByTestId('back-button'));

    expect(onBackPress).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('should call navigation.goBack when back button is pressed without custom handler', () => {
    const { getByTestId } = render(
      <AppHeader title="Test" showBackButton />
    );

    fireEvent.press(getByTestId('back-button'));

    expect(mockCanGoBack).toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('should not call navigation.goBack when canGoBack returns false', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByTestId } = render(
      <AppHeader title="Test" showBackButton />
    );

    fireEvent.press(getByTestId('back-button'));

    expect(mockCanGoBack).toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('should render right component when provided', () => {
    const RightComponent = <Text testID="right-component">Right</Text>;
    const { getByTestId } = render(
      <AppHeader title="Test" rightComponent={RightComponent} />
    );

    expect(getByTestId('right-component')).toBeTruthy();
    expect(getByTestId('right-component')).toHaveTextContent('Right');
  });

  it('should render with custom testID', () => {
    const { getByTestId } = render(
      <AppHeader title="Test" testID="custom-header" />
    );

    expect(getByTestId('custom-header')).toBeTruthy();
  });

  it('should render back button with correct accessibility props', () => {
    const { getByTestId } = render(
      <AppHeader title="Test" showBackButton />
    );

    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Go back');
    expect(backButton.props.accessibilityRole).toBe('button');
    expect(backButton.props.accessibilityHint).toBe('Navigates to the previous screen');
  });

  it('should truncate long titles', () => {
    const longTitle = 'This is a very long title that should be truncated';
    const { getByText } = render(<AppHeader title={longTitle} />);

    const titleElement = getByText(longTitle);
    expect(titleElement.props.numberOfLines).toBe(1);
    expect(titleElement.props.ellipsizeMode).toBe('tail');
  });

  it('should have correct accessibility props for title', () => {
    const { getByText } = render(<AppHeader title="Test Title" />);

    const titleElement = getByText('Test Title');
    expect(titleElement.props.accessibilityRole).toBe('header');
  });
});

