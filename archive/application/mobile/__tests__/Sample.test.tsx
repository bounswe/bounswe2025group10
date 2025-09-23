import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

describe('Sample Test', () => {
  it('renders a simple component', () => {
    const { getByText } = render(
      <View>
        <Text>Hello, Test!</Text>
      </View>
    );
    expect(getByText('Hello, Test!')).toBeTruthy();
  });
}); 