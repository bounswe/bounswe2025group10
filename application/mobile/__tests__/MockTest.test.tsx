import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const TestComponent = () => {
  return (
    <View>
      <Text>Hello World</Text>
      <TextInput 
        testID="test-input"
        value="test"
        onChangeText={() => {}}
      />
      <TouchableOpacity testID="test-button">
        <Text>Press Me</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Mock Test', () => {
  it('renders basic components', () => {
    const { getByText, getByTestId } = render(<TestComponent />);
    
    expect(getByText('Hello World')).toBeTruthy();
    expect(getByTestId('test-input')).toBeTruthy();
    expect(getByTestId('test-button')).toBeTruthy();
  });
}); 