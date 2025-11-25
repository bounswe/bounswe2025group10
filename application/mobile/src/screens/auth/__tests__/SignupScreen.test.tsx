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

// Import after mocks
const { SignupScreen } = require('../SignupScreen');
const { authService } = require('../../../services/api');

describe('SignupScreen', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = { navigate: mockNavigate } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    
    // Reset authService mocks
    authService.signup = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render signup screen correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByText('Create Account')).toBeTruthy();
      expect(getByText('Sign up to get started')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Username')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should have correct input configurations', () => {
      const { getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');

      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(usernameInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should render login link', () => {
      const { getByText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByText(/Already have an account/)).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });
  });

  describe('Input Handling', () => {
    it('should update email input', () => {
      const { getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update username input', () => {
      const { getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      fireEvent.changeText(usernameInput, 'testuser');

      expect(usernameInput.props.value).toBe('testuser');
    });

    it('should update password input', () => {
      const { getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Validation', () => {
    it('should show alert when all fields are empty', async () => {
      const { getByText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });
    });

    it('should show alert when email is empty', async () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });
    });

    it('should show alert when username is empty', async () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });
    });

    it('should show alert when password is empty', async () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });
    });

    it('should show alert when password is less than 8 characters', async () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'pass123'); // Only 7 characters

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Password must be at least 8 characters long'
        );
      });
    });
  });

  describe('Signup Success', () => {
    it('should successfully signup with valid credentials', async () => {
      const mockResponse = {
        message: 'User created successfully.',
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      authService.signup.mockResolvedValueOnce(mockResponse);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(authService.signup).toHaveBeenCalledWith({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('should show success alert and navigate to login on successful signup', async () => {
      const mockResponse = {
        message: 'User created successfully.',
      };

      authService.signup.mockResolvedValueOnce(mockResponse);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Account created successfully! Please login.',
          expect.arrayContaining([
            expect.objectContaining({
              text: 'OK',
              onPress: expect.any(Function),
            }),
          ])
        );
      });
    });

    it('should navigate to login when success alert OK is pressed', async () => {
      const mockResponse = {
        message: 'User created successfully.',
      };

      let alertCallback: Function | undefined;
      jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          alertCallback = buttons[0].onPress;
        }
      });

      authService.signup.mockResolvedValueOnce(mockResponse);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing OK on the alert
      if (alertCallback) {
        alertCallback();
      }

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Signup Errors', () => {
    it('should show error alert when signup fails with server error', async () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Email already exists' },
        },
      };

      authService.signup.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email already exists');
      });
    });

    it('should show generic error alert when signup fails without specific error', async () => {
      const error = {
        message: 'Network error',
      };

      authService.signup.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'An error occurred during signup'
        );
      });
    });

    it('should handle username already taken error', async () => {
      const error = {
        response: {
          data: { error: 'Username already taken' },
        },
      };

      authService.signup.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'existinguser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Username already taken');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while signup is in progress', async () => {
      let resolveSignup;
      authService.signup.mockImplementation(
        () => new Promise((resolve) => { resolveSignup = resolve; })
      );

      const { getByText, getByPlaceholderText, queryByText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      // Wait for loading state to show (ActivityIndicator replaces "Sign Up" text)
      await waitFor(() => {
        expect(queryByText('Sign Up')).toBeNull();
      });

      // Resolve the signup promise to clean up
      if (resolveSignup) {
        resolveSignup({ message: 'User created successfully.' });
      }
    });

    it('should re-enable button after signup completes', async () => {
      authService.signup.mockResolvedValueOnce({
        message: 'User created successfully.',
      });

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      // Wait for alert to be called and button to be re-enabled
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      await waitFor(() => {
        const updatedButton = getByText('Sign Up');
        expect(updatedButton).toBeTruthy();
      });
    });

    it('should re-enable button after signup fails', async () => {
      authService.signup.mockRejectedValueOnce(new Error('Signup failed'));

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      // Wait for alert to be called and button to be re-enabled
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      await waitFor(() => {
        const updatedButton = getByText('Sign Up');
        expect(updatedButton).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login screen when login link is pressed', () => {
      const { getByText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const loginLink = getByText(/Already have an account/);
      fireEvent.press(loginLink.parent);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Password Requirements', () => {
    it('should accept password with exactly 8 characters', async () => {
      authService.signup.mockResolvedValueOnce({
        message: 'User created successfully.',
      });

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, '12345678'); // Exactly 8 characters

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(authService.signup).toHaveBeenCalled();
      });

      // Should not show password length error
      expect(Alert.alert).not.toHaveBeenCalledWith(
        'Error',
        'Password must be at least 8 characters long'
      );
    });

    it('should accept password with more than 8 characters', async () => {
      authService.signup.mockResolvedValueOnce({
        message: 'User created successfully.',
      });

      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('Email');
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'verylongpassword123');

      const signupButton = getByText('Sign Up');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(authService.signup).toHaveBeenCalled();
      });
    });
  });
});

