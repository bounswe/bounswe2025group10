/**
 * @format
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    
    // Check if the header is rendered
    expect(screen.getByText('Step One')).toBeTruthy();
    
    // Check if the instructions are rendered
    expect(screen.getByText('Edit App.tsx to change this screen')).toBeTruthy();
  });
});
