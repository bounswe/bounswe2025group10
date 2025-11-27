import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock axios first
jest.mock('axios', () => ({
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

// Mock storage
jest.mock('../../utils/storage');

// Mock authService
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    getUserInfo: jest.fn(),
  },
}));

// Import after mocks
const { AuthProvider, useAuth } = require('../AuthContext');
const { storage } = require('../../utils/storage');
const { authService } = require('../../services/api');

const mockStorage = storage as any;
const mockAuthService = authService as any;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getToken.mockResolvedValue(null);
    mockStorage.getAdminStatus.mockResolvedValue(false);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial auth state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.userData).toBeNull();
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockLoginResponse = {
        message: 'Login successful',
        token: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
        isAdmin: false,
        username: 'testuser',
      };

      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        profile_picture: 'url',
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);
      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult).toEqual(mockLoginResponse);
      expect(mockStorage.setToken).toHaveBeenCalledWith('access-token');
      expect(mockStorage.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockStorage.setAdminStatus).toHaveBeenCalledWith(false);

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.userData).toEqual(mockUserData);
      });
    });

    it('should set admin status for admin user', async () => {
      const mockLoginResponse = {
        message: 'Login successful',
        token: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
        isAdmin: true,
        username: 'adminuser',
      };

      const mockUserData = {
        email: 'admin@example.com',
        username: 'adminuser',
        isAdmin: true,
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);
      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      expect(mockStorage.setAdminStatus).toHaveBeenCalledWith(true);

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should return null on login failure', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('wrong@example.com', 'wrongpass');
      });

      expect(loginResult).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return null when no token in response', async () => {
      const mockLoginResponse = {
        message: 'Login successful',
        // No token field
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle getUserInfo errors gracefully', async () => {
      const mockLoginResponse = {
        message: 'Login successful',
        token: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);
      mockAuthService.getUserInfo.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Login should still succeed even if getUserInfo fails
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userData).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      // First login the user
      const mockLoginResponse = {
        message: 'Login successful',
        token: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
        isAdmin: false,
      };

      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);
      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Verify user is logged in
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Now logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockStorage.clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.userData).toBeNull();
    });
  });

  describe('fetchUserData', () => {
    it('should fetch and set user data', async () => {
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        profile_picture: 'url',
      };

      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.fetchUserData();
      });

      await waitFor(() => {
        expect(result.current.userData).toEqual(mockUserData);
      });
    });

    it('should handle errors when fetching user data', async () => {
      const error = new Error('Fetch error');
      mockAuthService.getUserInfo.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.fetchUserData();
      });

      // User data should remain null on error
      expect(result.current.userData).toBeNull();
    });
  });

  describe('initial auth check', () => {
    it('should restore auth state from storage on mount', async () => {
      const mockToken = 'stored-token';
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      mockStorage.getToken.mockResolvedValueOnce(mockToken);
      mockStorage.getAdminStatus.mockResolvedValueOnce(false);
      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.userData).toEqual(mockUserData);
      });
    });

    it('should restore admin status from storage', async () => {
      const mockToken = 'stored-token';
      const mockUserData = {
        email: 'admin@example.com',
        username: 'adminuser',
        isAdmin: true,
      };

      mockStorage.getToken.mockResolvedValueOnce(mockToken);
      mockStorage.getAdminStatus.mockResolvedValueOnce(true);
      mockAuthService.getUserInfo.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.userData).toEqual(mockUserData);
      });
    });

    it('should not fetch user data when no token exists', async () => {
      mockStorage.getToken.mockResolvedValueOnce(null);
      mockStorage.getAdminStatus.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockAuthService.getUserInfo).not.toHaveBeenCalled();
    });
  });
});

