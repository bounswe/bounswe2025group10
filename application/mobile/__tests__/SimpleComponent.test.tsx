import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

const SimpleComponent = () => {
  return (
    <View>
      <Text>Hello, World!</Text>
    </View>
  );
};

describe('SimpleComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello, World!')).toBeTruthy();
  });
}); 