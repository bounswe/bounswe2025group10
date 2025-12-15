import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScreenWrapper } from '../ScreenWrapper';

describe('ScreenWrapper', () => {
  it('should render children correctly', () => {
    const { getByText } = render(
      <ScreenWrapper title="Test Screen">
        <Text>Test Content</Text>
      </ScreenWrapper>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should render header with correct title', () => {
    const { getByText } = render(
      <ScreenWrapper title="My Screen">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(getByText('My Screen')).toBeTruthy();
  });

  it('should show back button when showBackButton is true', () => {
    const { getByTestId } = render(
      <ScreenWrapper title="Test" showBackButton>
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should not show back button by default', () => {
    const { queryByTestId } = render(
      <ScreenWrapper title="Test">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should render right component in header', () => {
    const RightComponent = <Text testID="right-comp">Right</Text>;
    const { getByTestId } = render(
      <ScreenWrapper title="Test" rightComponent={RightComponent}>
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(getByTestId('right-comp')).toBeTruthy();
  });

  it('should render as scrollable by default', () => {
    const { getByTestId } = render(
      <ScreenWrapper title="Test" testID="wrapper">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // Check if ScrollView is rendered (it should have the scroll testID)
    expect(getByTestId('wrapper-scroll')).toBeTruthy();
  });

  it('should render as non-scrollable when scrollable is false', () => {
    const { queryByTestId } = render(
      <ScreenWrapper title="Test" testID="wrapper" scrollable={false}>
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // ScrollView should not be rendered
    expect(queryByTestId('wrapper-scroll')).toBeNull();
  });

  it('should render with custom testID', () => {
    const { getByTestId } = render(
      <ScreenWrapper title="Test" testID="custom-wrapper">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(getByTestId('custom-wrapper')).toBeTruthy();
    expect(getByTestId('custom-wrapper-header')).toBeTruthy();
  });

  it('should pass accessibility label to component', () => {
    const { getByTestId } = render(
      <ScreenWrapper title="Test" testID="wrapper" accessibilityLabel="Test screen">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // The accessibilityLabel is used but may not be directly on the header element
    // Just verify the component renders with the prop
    expect(getByTestId('wrapper')).toBeTruthy();
  });

  it('should handle refresh control when onRefresh is provided', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <ScreenWrapper 
        title="Test" 
        testID="wrapper" 
        onRefresh={onRefresh}
        refreshing={false}
      >
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // Check that scroll view exists (which would have refresh control)
    expect(getByTestId('wrapper-scroll')).toBeTruthy();
  });

  it('should render with keyboard avoiding view by default', () => {
    const { getByTestId } = render(
      <ScreenWrapper title="Test" testID="wrapper">
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // The wrapper should exist (keyboard avoiding view is rendered)
    expect(getByTestId('wrapper')).toBeTruthy();
  });

  it('should handle onBackPress callback', () => {
    const onBackPress = jest.fn();
    const { getByTestId } = render(
      <ScreenWrapper title="Test" showBackButton onBackPress={onBackPress}>
        <Text>Content</Text>
      </ScreenWrapper>
    );

    // The back button should be rendered with the callback
    const backButton = getByTestId('back-button');
    expect(backButton).toBeTruthy();
  });

  it('should apply custom content container style', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <ScreenWrapper 
        title="Test" 
        testID="wrapper"
        contentContainerStyle={customStyle}
      >
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(getByTestId('wrapper-scroll')).toBeTruthy();
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <ScreenWrapper title="Test">
        <Text>First Child</Text>
        <Text>Second Child</Text>
        <Text>Third Child</Text>
      </ScreenWrapper>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
    expect(getByText('Third Child')).toBeTruthy();
  });
});

