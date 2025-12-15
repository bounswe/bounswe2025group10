import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import axios from 'axios';

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

// Mock auth context
const mockLogin = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isAdmin: false,
    userData: null,
    logout: jest.fn(),
    fetchUserData: jest.fn(),
  }),
}));

// Import after mocks
const { LoginScreen } = require('../LoginScreen');
const { authService } = require('../../../services/api');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LoginScreen', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = { navigate: mockNavigate } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    
    // Mock joke API
    mockedAxios.get.mockResolvedValue({
      data: {
        setup: 'Why did the chicken cross the road?',
        punchline: 'To get to the other side!',
      },
    });
    
    // Reset authService mocks
    authService.login = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render login screen correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('should load and display a random joke', async () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Why did the chicken cross the road?')).toBeTruthy();
      expect(getByText('To get to the other side!')).toBeTruthy();
    });
  });

  it('should handle joke API failure gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Welcome to the app!')).toBeTruthy();
    });
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should show alert when fields are empty', async () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('should show alert when email is empty', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('should show alert when password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('should successfully login with valid credentials', async () => {
    const mockResponse = {
      message: 'Login successful',
      token: { access: 'token', refresh: 'refresh' },
      username: 'testuser',
    };

    authService.login.mockResolvedValueOnce(mockResponse);
    mockLogin.mockResolvedValueOnce(mockResponse);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show error alert on login failure', async () => {
    const error = {
      response: {
        status: 401,
        data: { error: 'Invalid credentials' },
      },
    };

    authService.login.mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpass');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
    });
  });

  it('should show error alert when no response from server', async () => {
    const error = {
      request: {},
      message: 'Network error',
    };

    authService.login.mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No response from server. Please check your internet connection.'
      );
    });
  });

  it('should show error alert when server returns no token', async () => {
    const mockResponse = {
      message: 'Login successful',
      // No token field
    };

    authService.login.mockResolvedValueOnce(mockResponse as any);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid server response');
    });
  });

  it('should show error alert when context login fails', async () => {
    const mockResponse = {
      message: 'Login successful',
      token: { access: 'token', refresh: 'refresh' },
    };

    authService.login.mockResolvedValueOnce(mockResponse);
    mockLogin.mockResolvedValueOnce(null);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to complete login process');
    });
  });

  it('should navigate to signup screen when signup link is pressed', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const signupLink = getByText(/Sign up/);
    if (signupLink.parent) {
      fireEvent.press(signupLink.parent);
    }

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
  });

  it('should disable login button while loading', async () => {
    let resolveLogin: ((value: unknown) => void) | undefined;
    authService.login.mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    const { getByText, getByPlaceholderText, queryByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    // Wait for loading state to show (ActivityIndicator replaces "Login" text)
    await waitFor(() => {
      expect(queryByText('Login')).toBeNull();
    });

    // Resolve the login promise to clean up
    if (resolveLogin) {
      resolveLogin({ message: 'success', token: { access: 'token', refresh: 'refresh' } });
    }
  });

  it('should have correct input configurations', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');

    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});

