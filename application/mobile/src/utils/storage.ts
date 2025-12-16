import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const ADMIN_STATUS_KEY = '@admin_status';

export const storage = {
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error saving token:', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting token:', error);
      return null;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error saving refresh token:', error);
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  },

  setAdminStatus: async (isAdmin: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(ADMIN_STATUS_KEY, isAdmin.toString());
    } catch (error) {
      logger.error('Error saving admin status:', error);
    }
  },

  getAdminStatus: async (): Promise<boolean> => {
    try {
      const status = await AsyncStorage.getItem(ADMIN_STATUS_KEY);
      return status === 'true';
    } catch (error) {
      logger.error('Error getting admin status:', error);
      return false;
    }
  },

  clearTokens: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, ADMIN_STATUS_KEY]);
    } catch (error) {
      logger.error('Error clearing tokens:', error);
    }
  },
};
