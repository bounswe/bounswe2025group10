import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

// A simple form component with validation
const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Basic validation
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    onSubmit({ email, password });
  };

  return (
    <View style={styles.container}>
      {error ? <Text testID="error-message" style={styles.error}>{error}</Text> : null}
      
      <TextInput
        testID="email-input"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
      />
      
      <TextInput
        testID="password-input"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />
      
      <TouchableOpacity 
        testID="submit-button"
        onPress={handleSubmit}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

// Tests
describe('LoginForm', () => {
  it('shows error for invalid email', () => {
    const { getByTestId, queryByTestId } = render(<LoginForm onSubmit={() => {}} />);
    
    // Initially, there should be no error
    expect(queryByTestId('error-message')).toBeNull();
    
    // Enter invalid email
    fireEvent.changeText(getByTestId('email-input'), 'invalidemail');
    
    // Enter valid password
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    
    // Try to submit
    fireEvent.press(getByTestId('submit-button'));
    
    // Should show email error
    expect(getByTestId('error-message').props.children).toBe('Please enter a valid email');
  });

  it('shows error for short password', () => {
    const { getByTestId, queryByTestId } = render(<LoginForm onSubmit={() => {}} />);
    
    // Enter valid email
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    
    // Enter short password
    fireEvent.changeText(getByTestId('password-input'), '12345');
    
    // Try to submit
    fireEvent.press(getByTestId('submit-button'));
    
    // Should show password error
    expect(getByTestId('error-message').props.children).toBe('Password must be at least 6 characters');
  });

  it('calls onSubmit with form data when valid', () => {
    const mockSubmit = jest.fn();
    const { getByTestId } = render(<LoginForm onSubmit={mockSubmit} />);
    
    // Enter valid email and password
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    
    // Submit form
    fireEvent.press(getByTestId('submit-button'));
    
    // Check if onSubmit was called with correct data
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
}); 