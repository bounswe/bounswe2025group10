import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService, AuthResponse } from '../services/api';

interface UserData {
  email: string;
  username: string;
  profile_picture?: string; // URL or relative path to profile picture
}

interface AuthContextType {
  isAuthenticated: boolean;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchUserData = async () => {
    try {
      const data = await authService.getUserInfo();
      console.log('Fetched user data:', JSON.stringify(data, null, 2));
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      setIsAuthenticated(!!token);
      if (token) {
        await fetchUserData();
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.token) {
        await storage.setToken(response.token.access);
        await storage.setRefreshToken(response.token.refresh);
        setIsAuthenticated(true);
        await fetchUserData();
        return response;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const logout = async () => {
    await storage.clearTokens();
    setIsAuthenticated(false);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
