import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('storage utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setToken', () => {
    it('should store token successfully', async () => {
      const token = 'test-token-123';
      await storage.setToken(token);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@auth_token', token);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when storing token', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(error);

      await storage.setToken('token');

      expect(consoleSpy).toHaveBeenCalledWith('Error saving token:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('getToken', () => {
    it('should retrieve token successfully', async () => {
      const token = 'stored-token-456';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(token);

      const result = await storage.getToken();

      expect(result).toBe(token);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@auth_token');
    });

    it('should return null when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storage.getToken();

      expect(result).toBeNull();
    });

    it('should handle errors when retrieving token', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Retrieval error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

      const result = await storage.getToken();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error getting token:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('setRefreshToken', () => {
    it('should store refresh token successfully', async () => {
      const refreshToken = 'refresh-token-789';
      await storage.setRefreshToken(refreshToken);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@refresh_token', refreshToken);
    });

    it('should handle errors when storing refresh token', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(error);

      await storage.setRefreshToken('token');

      expect(consoleSpy).toHaveBeenCalledWith('Error saving refresh token:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token successfully', async () => {
      const refreshToken = 'stored-refresh-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(refreshToken);

      const result = await storage.getRefreshToken();

      expect(result).toBe(refreshToken);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@refresh_token');
    });

    it('should return null when no refresh token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storage.getRefreshToken();

      expect(result).toBeNull();
    });

    it('should handle errors when retrieving refresh token', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Retrieval error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

      const result = await storage.getRefreshToken();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error getting refresh token:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('setAdminStatus', () => {
    it('should store admin status as true', async () => {
      await storage.setAdminStatus(true);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@admin_status', 'true');
    });

    it('should store admin status as false', async () => {
      await storage.setAdminStatus(false);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@admin_status', 'false');
    });

    it('should handle errors when storing admin status', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(error);

      await storage.setAdminStatus(true);

      expect(consoleSpy).toHaveBeenCalledWith('Error saving admin status:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('getAdminStatus', () => {
    it('should return true when admin status is true', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      const result = await storage.getAdminStatus();

      expect(result).toBe(true);
    });

    it('should return false when admin status is false', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');

      const result = await storage.getAdminStatus();

      expect(result).toBe(false);
    });

    it('should return false when admin status is null', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storage.getAdminStatus();

      expect(result).toBe(false);
    });

    it('should handle errors when retrieving admin status', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Retrieval error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

      const result = await storage.getAdminStatus();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting admin status:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('clearTokens', () => {
    it('should clear all stored tokens and admin status', async () => {
      await storage.clearTokens();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@auth_token',
        '@refresh_token',
        '@admin_status',
      ]);
    });

    it('should handle errors when clearing tokens', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Clear error');
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(error);

      await storage.clearTokens();

      expect(consoleSpy).toHaveBeenCalledWith('Error clearing tokens:', error);
      consoleSpy.mockRestore();
    });
  });
});

